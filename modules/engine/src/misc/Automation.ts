import { ADSR } from "../index.js";

export interface BaseAutomationFrame<T extends string> {
    atTime: number;
    curveType: T;
    value: number;
}

export interface InstantAutomationFrame extends BaseAutomationFrame<"instant"> {}
export interface LinearAutomationFrame extends BaseAutomationFrame<"linear"> {}

export type AutomationFrame = InstantAutomationFrame | LinearAutomationFrame;

export interface AutomationData {
    frames: AutomationFrame[];
}

export class Automation {
    #data: AutomationData = {
        frames: []
    };

    constructor(public readonly initialValue: number = 0) {}

    addFrame(frame: AutomationFrame) {
        this.#data.frames.push(frame);
        this.#data.frames.sort((a, b) => a.atTime - b.atTime); // TODO binary search
        return this;
    }

    fromADSRAttackPhase(adsr: ADSR) {
        this.addFrame({
            atTime: adsr.attackDelay,
            curveType: "instant",
            value: 0
        });
        this.addFrame({
            atTime: adsr.attackDelay + adsr.attackDuration,
            curveType: "linear",
            value: 1
        });
        this.addFrame({
            atTime: adsr.attackDelay + adsr.attackDuration + adsr.decayDuration,
            curveType: "linear",
            value: adsr.sustainLevel
        });
        return this;
    }

    get(time: number) {
        if (this.#data.frames.length == 0) return this.initialValue;

        // TODO binary search
        let prev: AutomationFrame, next = this.#data.frames[0];
        let prevVal = this.initialValue, nextVal = next.value;
        let prevTime = 0, nextTime = next.atTime;
        let idx = 0;

        while (time >= nextTime) {
            prev = this.#data.frames[idx++];
            prevVal = prev.value;
            prevTime = prev.atTime;
            next = this.#data.frames[idx];

            if (!next) {
                nextVal = prevVal;
                nextTime = prev.atTime + 1;
                break;
            } else {
                nextVal = next.value;
                nextTime = next.atTime;
            }
        }

        const progress = Math.max(time - prevTime, 1) / (nextTime - prevTime);
        if (!next) return prevVal;
        switch (next.curveType) {
            case "instant": return prevVal;
            default: return (1 - progress) * prevVal + progress * nextVal;
        }
    }
}