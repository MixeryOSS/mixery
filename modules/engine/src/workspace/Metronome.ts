import { PluckNode, UniqueID, Units, Workspace } from "../index.js";

export class Metronome {
    node: PluckNode | undefined;
    division = Units.BEAT;
    placedUnits = new Set<number>();
    tickingBuffer = 100; // 100ms "buffer"
    enabled = false;

    constructor(public readonly workspace: Workspace) {
        this.node = new PluckNode("system-metronome", workspace.audio);
        (this.node.audioOut.socket as AudioNode).connect(workspace.audio.destination);
    }

    placeTicks(bpm: number, currentMs: number) {
        if (!this.enabled) return;

        const currentUnit = Units.msToUnits(bpm, currentMs);
        const currentTickIndex = Math.floor(currentUnit / this.division);
        const currentTickPosition = currentTickIndex * this.division;
        const tickPositions = [currentTickPosition];
        
        while ((tickPositions[tickPositions.length - 1] + this.division) < Units.msToUnits(bpm, currentMs + this.tickingBuffer)) {
            tickPositions.push(tickPositions[tickPositions.length - 1] + this.division);
        }

        tickPositions.forEach(pos => {
            if (this.placedUnits.has(pos)) return;
            this.placedUnits.add(pos);
            const playAt = Units.unitsToMs(bpm, pos);
            const isMajor = (Math.floor(pos / Units.BEAT) % 4) == 0;

            const delay = playAt - currentMs;
            this.node.midiIn.emitNote({
                uid: UniqueID.generate(),
                signalType: "delayed",
                eventType: "keydown",
                delayMs: delay,
                midiIndex: isMajor? 72 : 69,
                velocity: 0.8
            });
        });
    }

    clear() {
        this.placedUnits.clear();
    }
}