import { AudioClip, ClippedNote, NotesClip, Playable, Player, UniqueID, Units } from "../index.js";

// Internal code for Player.ts
export namespace internal {
    export function scheduleNotesClip(player: Player, clip: NotesClip) {
        if (clip.notes.length == 0) return;

        const bpm = player.project.bpm;
        const clipStartPointer = Units.unitsToMs(bpm, clip.startAtUnit);
        const clipDuration = Units.unitsToMs(bpm, clip.durationUnit);

        const livenotes = clip.notes.map(note => {
            const noteStartPointer = clipStartPointer + Units.unitsToMs(bpm, note.startAtUnit);
            const noteDuration = Units.unitsToMs(bpm, note.durationUnit);
            let keydownOffset: number, keyupOffset: number;
            const uid = UniqueID.generate();

            return <Playable<ClippedNote>> {
                ref: note,
                startMs: noteStartPointer,
                durationMs: noteDuration,
                play(offsetAheadMs) {
                    // If the retrigger is late than previous trigger, cancel
                    const triggerAt = player.currentMs + offsetAheadMs;
                    if (keydownOffset != undefined && triggerAt >= keydownOffset) return;

                    // offsetAheadMs: how many ms should we delay before the clip is played
                    player.project.nodes.sendNoteSignal(clip.clipChannel, {
                        uid,
                        signalType: "delayed",
                        delayMs: Math.max(offsetAheadMs, 0),
                        eventType: "keydown",
                        midiIndex: note.midiIndex,
                        velocity: note.velocity
                    });
                    
                    keydownOffset = triggerAt;
                },
                stop(offsetAheadMs) {
                    const triggerAt = player.currentMs + offsetAheadMs;
                    if (keyupOffset != undefined && triggerAt >= keyupOffset) return;
                    
                    player.project.nodes.sendNoteSignal(clip.clipChannel, {
                        uid,
                        signalType: "delayed",
                        delayMs: Math.max(offsetAheadMs, 0),
                        eventType: "keyup",
                        midiIndex: note.midiIndex,
                        velocity: note.velocity
                    });

                    keyupOffset = triggerAt;
                }
            };
        });

        player.scheduled.add({
            ref: clip,
            startMs: clipStartPointer,
            durationMs: clipDuration,
            play(offsetAheadMs) {
                livenotes.forEach(note => player.scheduled.add(note));
            },
            stop(offsetAheadMs) {
                livenotes.forEach(note => {
                    if (player.playing.has(note)) {
                        note.stop(offsetAheadMs);
                        player.playing.delete(note);
                    } else {
                        player.scheduled.delete(note);
                    }
                });
            },
        });
    }

    export function scheduleAudioClip(player: Player, clip: AudioClip) {
        const bpm = player.project.bpm;
        const clipStartPointer = Units.unitsToMs(bpm, clip.startAtUnit);
        const clipDuration = Units.unitsToMs(bpm, clip.durationUnit);
        const audioStartOffset = Units.unitsToMs(bpm, clip.audioStartAtUnit);

        let node: AudioBufferSourceNode;

        player.scheduled.add({
            ref: clip,
            startMs: clipStartPointer,
            durationMs: clipDuration,
            play: function play(offsetAheadMs) {
                if (node) return;
                const ref = clip.resource;
                const res = player.project.resourcesManager.get(ref);
                if (!res) {
                    // Reschedule
                    const timestamp = player.currentMs;
                    player.project.resourcesManager.loadResource(ref).then(() => {
                        const elapsed = player.currentMs;
                        const delta = elapsed - timestamp;
                        play(offsetAheadMs - delta);
                    });
                    return;
                }

                let audioSlice = audioStartOffset + (offsetAheadMs < 0? -offsetAheadMs : 0);
                if (!res.audioBuffer) return;
                node = player.audioContext.createBufferSource();
                node.buffer = res.audioBuffer;
                const toNode = player.project.nodes.getAudioSourceNode(clip.clipChannel);
                if (toNode) node.connect(toNode.audioOut.socket as AudioNode);
                node.start(
                    player.audioContext.currentTime + Math.max(offsetAheadMs, 0) / 1000,
                    audioSlice / 1000,
                    clipDuration / 1000
                );
            },
            stop(offsetAheadMs) {
                if (!node) return;
                node.stop(player.audioContext.currentTime + offsetAheadMs / 1000);
                // Thanks god .stop() can be called multiple times
            },
        });
    }
}