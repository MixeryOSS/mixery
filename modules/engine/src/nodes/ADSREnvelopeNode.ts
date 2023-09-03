import { GlobalRegistries, IPort, Identifier, MidiPort, SignalPort } from "../index.js";
import { INode, NodeControl, NodeControls, NodeFactory } from "./INode.js";

export interface ADSR {
    attackDelay: number;
    attackDuration: number;
    decayDuration: number;
    sustainLevel: number;
    releaseDuration: number;
}

export class ADSREnvelopeNode implements INode<ADSREnvelopeNode, ADSR> {
    static readonly ID = "mixery:adsr";
    typeId: Identifier = ADSREnvelopeNode.ID;
    nodeName?: string = "ADSR Envelope";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;
    data: ADSR = {
        attackDelay: 0,
        attackDuration: 100,
        decayDuration: 200,
        sustainLevel: 0.9,
        releaseDuration: 100
    };

    controls: NodeControl<any>[] = [];
    midiIn: MidiPort;
    gainIn: SignalPort;
    midiOut: MidiPort;
    valueOut: SignalPort;

    playingNotes: Map<bigint, ConstantSourceNode> = new Map();

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        const self = this;
        this.midiIn = new MidiPort(this, "midiIn");
        this.midiIn.portName = "MIDI In";

        this.midiOut = new MidiPort(this, "midiOut");
        this.midiOut.portName = "MIDI Out";

        this.valueOut = new SignalPort(this, "valueOut", audio, audio.createGain());
        this.valueOut.portName = "Value";

        this.gainIn = new SignalPort(this, "gainIn", audio, (this.valueOut.socket as GainNode).gain);
        this.gainIn.portName = "Gain";

        this.controls.push(NodeControls.makeParamControl("Gain", (this.valueOut.socket as GainNode).gain));
        this.controls.push({
            label: "Attack Delay (ms)",
            get value() { return self.data.attackDelay; },
            set value(v) { self.data.attackDelay = v; }
        });
        this.controls.push({
            label: "Attack Duration (ms)",
            get value() { return self.data.attackDuration; },
            set value(v) { self.data.attackDuration = v; }
        });
        this.controls.push({
            label: "Decay Duration (ms)",
            get value() { return self.data.decayDuration; },
            set value(v) { self.data.decayDuration = v; }
        });
        this.controls.push({
            label: "Sustain Level (0 to 1)",
            get value() { return self.data.sustainLevel; },
            set value(v) { self.data.sustainLevel = v; }
        });
        this.controls.push({
            label: "Release Duration (ms)",
            get value() { return self.data.releaseDuration; },
            set value(v) { self.data.releaseDuration = v; }
        });

        this.midiIn.onNoteEvent.listen(note => {
            const uid = note.uid;
            const delay = note.signalType == "instant"? 0 : note.delayMs / 1000;

            if (note.eventType == "keydown" && !this.playingNotes.has(uid)) {
                const val = audio.createConstantSource();
                const now = audio.currentTime;
                const atkDelay = delay + this.data.attackDelay / 1000;
                const atkDuration = this.data.attackDuration / 1000;
                const decDuration = this.data.decayDuration / 1000;

                val.offset.value = 0;
                val.offset.setValueAtTime(0, now + atkDelay);
                val.offset.linearRampToValueAtTime(1, now + atkDelay + atkDuration);
                val.offset.linearRampToValueAtTime(this.data.sustainLevel, now + atkDelay + atkDuration + decDuration);
                val.connect(this.valueOut.socket as GainNode);
                val.start(delay);
                this.playingNotes.set(uid, val);
                this.midiOut.emitNote(note);
            } else if (note.eventType == "keyup" && this.playingNotes.has(uid)) {
                const val = this.playingNotes.get(uid);
                const now = audio.currentTime;
                const relDuration = this.data.releaseDuration / 1000;

                val.offset.cancelAndHoldAtTime(now + delay);
                val.offset.linearRampToValueAtTime(0, now + delay + relDuration);
                val.addEventListener("ended", () => this.playingNotes.delete(uid));
                val.stop(now + delay + relDuration + 1);
                this.midiOut.emitNote({
                    uid,
                    signalType: "delayed",
                    delayMs: delay * 1000 + self.data.releaseDuration,
                    eventType: "keyup",
                    midiIndex: note.midiIndex,
                    velocity: note.velocity
                });
            }
        });
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return [this.midiIn, this.gainIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.midiOut, this.valueOut];
    }

    saveNode(): ADSR {
        return structuredClone(this.data);
    }

    createCopy(): ADSREnvelopeNode {
        const node = new ADSREnvelopeNode(this.nodeId, (this.valueOut.socket as GainNode).context);
        node.data = structuredClone(this.data);
        return node;
    }

    calculateReleaseTime(): number {
        return this.data.releaseDuration;
    }

    static createFactory(): NodeFactory<ADSREnvelopeNode, ADSR> {
        return {
            typeId: ADSREnvelopeNode.ID,
            label: "ADSR Envelope",
            createNew(project, context, nodeId) {
                return new ADSREnvelopeNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new ADSREnvelopeNode(nodeId, project.workspace.audio);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(ADSREnvelopeNode.ID, ADSREnvelopeNode.createFactory());