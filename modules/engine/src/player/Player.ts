import { Clip, PlaylistTrack, Project } from "../index.js";
import { Units } from "../misc/Units.js";
import { internal } from "./Player.internal.js";

/**
 * The project player. This player basically handles the project playback.
 */
export class Player {
    /**
     * The timestamp obtained from `AudioContext`: Timestamp since the `play()` method was called.
     * This property is used for calculating current time relative to project.
     */
    playTimestampSec: number = -1;

    startAtMs: number = 0;

    /**
     * The quality loop function. The higher, the better. If you are experiencing some lag spikes
     * in main thread, consider decreasing this value.
     */
    quality: number = 100;

    /**
     * The amount of time (in milliseconds) to schedule clips playback ahead of current time. This
     * value is used for realtime playback only.
     */
    aheadOfTime: number = 10;

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
        const bpm = this.project.bpm;
        const currentPointer = this.currentMs;
        const searchPointer = currentPointer + this.aheadOfTime;

        // Place clip as playable objects to this.scheduled
        this.project.playlist.tracks.forEach(track => {
            if (track.isMuted) return;
            this.#loop$track(track);
        });

        // Update scheduled playable objects
        this.scheduled.forEach(scheduled => {
            if (searchPointer >= scheduled.startMs) {
                const aheadMs = scheduled.startMs - currentPointer;
                scheduled.play(aheadMs);
                this.scheduled.delete(scheduled);
                this.playing.add(scheduled);
            }
        });

        this.playing.forEach(scheduled => {
            if (searchPointer >= scheduled.startMs + scheduled.durationMs) {
                const aheadMs = (scheduled.startMs + scheduled.durationMs) - currentPointer;
                scheduled.stop(aheadMs);
                this.playing.delete(scheduled);
            }
        });

        // Metronome
        this.project.workspace.metronome.placeTicks(bpm, this.currentMs);
    }

    #loop$track(track: PlaylistTrack) {
        const bpm = this.project.bpm;
        const currentPointer = this.currentMs;
        const searchPointer = currentPointer + this.aheadOfTime;
        const backPointer = this.lastMs;
        // Our search window will be from backPointer to searchPointer

        track.clips.forEach(clip => {
            if (this.scheduledClips.has(clip)) return;
            const clipStartPointer = Units.unitsToMs(bpm, clip.startAtUnit);
            const clipDuration = Units.unitsToMs(bpm, clip.durationUnit);
            const clipEndPointer = clipStartPointer + clipDuration;
            if (!(
                (backPointer >= clipStartPointer && backPointer < clipEndPointer) ||
                (searchPointer >= clipStartPointer && searchPointer < clipEndPointer)
            )) return;

            this.scheduledClips.add(clip);
            switch (clip.type) {
                case "notes": internal.scheduleNotesClip(this, clip); break;
                case "audio": internal.scheduleAudioClip(this, clip); break;
                default: break; // TODO log warning
            }
        });

        this.lastMs = currentPointer;
    }

    /**
     * Play project.
     * @param playAtMs The start time position relative to project time.
     * @param loopCallback The callback that will be called on loop. Will not be called when
     * rendering audio.
     * @returns A `Promise<boolean>`, with `boolean` for play state change result. `true` if the
     * play state is changed from paused to playing.
     */
    async play(playAtMs: number = this.startAtMs, loopCallback?: () => any) {
        if (this.isPlaying) return false;
        this.startAtMs = playAtMs;
        this.playTimestampSec = this.audioContext.currentTime;
        this.lastMs = this.currentMs;
        if (this.audioContext instanceof AudioContext) await this.audioContext.resume();
        this.loop();
        this.loopingTask = setInterval(() => {
            this.loop();
            if (loopCallback) loopCallback();
        }, 1000 / this.quality);
        return true;
    }

    /**
     * Stop the playback.
     * @returns `true` if the play state is changed from playing to paused.
     */
    stop() {
        if (!this.isPlaying) return false;

        this.scheduledClips.clear();
        this.scheduled.clear();
        this.playing.forEach(playing => playing.stop(0));
        this.playing.clear();
        this.project.workspace.metronome.clear();

        this.playTimestampSec = -1;
        clearInterval(this.loopingTask);
        this.loopingTask = undefined;
        return true;
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
    play(offsetAheadMs: number): void;
    stop(offsetAheadMs: number): void;
}