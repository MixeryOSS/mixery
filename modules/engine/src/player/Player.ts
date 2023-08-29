import { AudioClip, AudioClipNode, Clip, ClippedNote, Project, Workspace } from "../index.js";
import { Units } from "../misc/Units.js";

export class Player {
    playTimestampSec: number = -1;
    startAtMs: number = 0;

    /**
     * Higher == more precise.
     */
    quality: number = 1000;

    constructor(
        public readonly project: Project
    ) {}

    get audioContext() { return this.project.workspace.audio; }
    get isPlaying() { return this.playTimestampSec >= 0; }
    get currentMs() {
        if (!this.isPlaying) return this.startAtMs;
        return this.startAtMs + (this.audioContext.currentTime - this.playTimestampSec) * 1000;
    }

    lastMs: number = -1;
    scheduledClips: Set<Clip> = new Set();
    scheduled: Set<Playable<any>> = new Set();
    playing: Set<Playable<any>> = new Set();
    loopingTask: ReturnType<typeof setInterval>;

    loop() {
        const last = this.lastMs;
        const next = this.currentMs;
        const bpm = this.project.bpm;
        const self = this;
        
        // We find all "not yet played" clips between this.lastMs and this.currentMs
        this.project.playlist.tracks.forEach(track => {
            if (track.isMuted) return;
            track.clips.forEach(clip => {
                if (this.scheduledClips.has(clip)) return;
                const clipStartMs = Units.unitsToMs(bpm, clip.startAtUnit);
                const clipDurationMs = Units.unitsToMs(bpm, clip.durationUnit);
                const clipEndMs = clipStartMs + clipDurationMs;
                if (!(
                    (last >= clipStartMs && last <= clipEndMs) ||
                    (next >= clipStartMs && next <= clipEndMs)
                )) return;

                switch (clip.type) {
                    case "notes": {
                        const notes = clip.notes.map(note => {
                            const noteStartMs = Units.unitsToMs(bpm, note.startAtUnit);
                            const noteDurationMs = Units.unitsToMs(bpm, note.durationUnit);
                            const noteEndMs = noteStartMs + noteDurationMs;
                            // TODO filtering for performance
    
                            return <Playable<ClippedNote>> {
                                ref: note,
                                startMs: clipStartMs + noteStartMs,
                                durationMs: noteDurationMs,
                                play() {
                                    self.project.nodes.sendNoteSignal(clip.clipChannel, {
                                        signalType: "instant",
                                        eventType: "keydown",
                                        midiIndex: note.midiIndex,
                                        velocity: note.velocity
                                    });
                                },
                                stop() {
                                    self.project.nodes.sendNoteSignal(clip.clipChannel, {
                                        signalType: "instant",
                                        eventType: "keyup",
                                        midiIndex: note.midiIndex,
                                        velocity: note.velocity
                                    });
                                },
                            };
                        });
    
                        this.scheduled.add({
                            ref: clip,
                            startMs: clipStartMs,
                            durationMs: clipDurationMs,
                            play() {
                                notes.forEach(note => self.scheduled.add(note));
                            },
                            stop() {
                                notes.forEach(note => {
                                    if (self.scheduled.has(note)) self.scheduled.delete(note);
                                    else if (self.playing.has(note)) {
                                        self.playing.delete(note);
                                        note.stop();
                                    }
                                });
                            },
                        });

                        break;
                    }
                    case "audio": {
                        let sourceNode: AudioBufferSourceNode;
                        const timestamp = self.audioContext.currentTime;
                        const timestampPlayer = self.currentMs / 1000;

                        function play(buffer: AudioBuffer, clip: AudioClip, dest: AudioClipNode) {
                            if (!buffer) return;
                            const bpm = self.project.bpm;
                            const playAt = self.playTimestampSec + clipStartMs / 1000; // At which time should the clip be played
                            let slice = Units.unitsToMs(bpm, clip.audioStartAtUnit) / 1000 + (timestampPlayer - clipStartMs / 1000); // Offset since start of the buffer
                            if (slice < 0.01) slice = 0; // TODO "ahead pointer" to prevent inaccurate timing

                            sourceNode = self.audioContext.createBufferSource();
                            sourceNode.buffer = buffer;
                            sourceNode.connect(dest.audioOut.socket as any);
                            sourceNode.start(playAt, slice); // TODO duration
                        }

                        this.scheduled.add({
                            ref: clip,
                            startMs: clipStartMs,
                            durationMs: clipDurationMs,
                            play() {
                                if (sourceNode) return;
                                let dest = self.project.nodes.nodes.find(v => v instanceof AudioClipNode);
                                if (!dest) return;

                                const res = self.project.resourcesManager.get(clip.resource);
                                if (!res) {
                                    self.project.resourcesManager.loadResourceWithLoader(clip.resource)
                                    .then(result => play(result.audioBuffer, clip, dest as AudioClipNode));
                                } else {
                                    play(res.audioBuffer, clip, dest as AudioClipNode);
                                }
                            },
                            stop() {
                                if (!sourceNode) return;
                                sourceNode.stop();
                                sourceNode = undefined;
                            }
                        });
                        break;
                    }
                }

                this.scheduledClips.add(clip);
            });
        });

        this.lastMs = next;

        // Play scheduled
        this.scheduled.forEach(scheduled => {
            if (next >= scheduled.startMs && next <= scheduled.startMs + scheduled.durationMs) {
                this.scheduled.delete(scheduled);
                this.playing.add(scheduled);
                scheduled.play();
            } else if (next > scheduled.startMs + scheduled.durationMs) {
                this.scheduled.delete(scheduled);
            }
        });

        this.playing.forEach(playing => {
            if (next > playing.startMs + playing.durationMs) {
                playing.stop();
                this.playing.delete(playing);
            }
        });

        // Metronome
        this.project.workspace.metronome.placeTicks(this.project.bpm, this.currentMs);
    }

    async play(playAtMs: number = this.startAtMs, loopCallback?: () => any) {
        if (this.isPlaying) return;
        this.startAtMs = playAtMs;
        this.playTimestampSec = this.audioContext.currentTime;
        this.lastMs = this.currentMs;
        if (this.audioContext instanceof AudioContext) await this.audioContext.resume();
        this.loop();
        this.loopingTask = setInterval(() => {
            this.loop();
            if (loopCallback) loopCallback();
        }, 1000 / this.quality);
    }

    stop() {
        if (!this.isPlaying) return;

        this.scheduledClips.clear();
        this.scheduled.clear();
        this.playing.forEach(playing => playing.stop());
        this.playing.clear();
        this.project.workspace.metronome.clear();

        this.playTimestampSec = -1;
        clearInterval(this.loopingTask);
        this.loopingTask = undefined;
    }

    pause() {
        if (!this.isPlaying) return;
        const lastCurrent = this.currentMs;
        this.stop();
        this.startAtMs = lastCurrent;
    }

    async seek(playAtMs: number) {
        this.pause();
        await this.play(playAtMs);
    }
}

export interface Playable<T> {
    ref: T;
    startMs: number;
    durationMs: number;
    play(): void;
    stop(): void;
}