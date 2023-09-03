import { GlobalRegistries } from "../../index.js";
import { Identifier } from "../../types.js";
import { INode, NodeControl, NodeFactory } from "../INode.js";
import { IPort } from "../ports/IPort.js";
import { MidiPort } from "../ports/MidiPort.js";
import { SignalPort } from "../ports/SignalPort.js";

export class SineOscillatorNode implements INode<SineOscillatorNode, any> {
    static readonly ID = "mixery:sine_oscillator";
    typeId: Identifier = SineOscillatorNode.ID;
    nodeName?: string = "Sine Oscillator";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    triggerIn: MidiPort;
    gainIn: SignalPort;
    freqIn: SignalPort;
    detuneIn: SignalPort;

    audioOut: SignalPort;

    playingNotes: Map<bigint, OscillatorNode> = new Map();

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        this.triggerIn = new MidiPort(this, "triggerIn");
        this.triggerIn.portName = "Trigger";

        this.freqIn = new SignalPort(this, "freqIn", audio, audio.createGain());
        this.freqIn.portName = "Frequency";

        this.detuneIn = new SignalPort(this, "detuneIn", audio, audio.createGain());
        this.detuneIn.portName = "Detune";

        this.audioOut = new SignalPort(this, "audioOut", audio, audio.createGain());
        this.audioOut.portName = "Audio";

        this.gainIn = new SignalPort(this, "gainIn", audio, (this.audioOut.socket as GainNode).gain);
        this.gainIn.portName = "Gain";

        this.triggerIn.onNoteEvent.listen(note => {
            const { uid } = note;
            const delay = note.signalType == "instant"? 0 : note.delayMs / 1000;

            if (note.eventType == "keydown" && !this.playingNotes.has(uid)) {
                const osc = audio.createOscillator();
                osc.frequency.value = 0;
                (this.freqIn.socket as GainNode).connect(osc.frequency);
                (this.detuneIn.socket as GainNode).connect(osc.detune);
                osc.connect(this.audioOut.socket as GainNode);
                osc.start(audio.currentTime + delay);
                this.playingNotes.set(uid, osc);
            } else {
                const osc = this.playingNotes.get(uid);
                osc.stop(audio.currentTime + delay);
                this.playingNotes.delete(uid);
            }
        });
    }

    getControls(): NodeControl<any>[] {
        return [];
    }

    getInputPorts(): IPort<any>[] {
        return [this.triggerIn, this.gainIn, this.freqIn, this.detuneIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.audioOut];
    }

    saveNode() {
        return {};
    }

    createCopy(): SineOscillatorNode {
        return new SineOscillatorNode(this.nodeId, (this.audioOut.socket as AudioNode).context);
    }

    static createFactory(): NodeFactory<SineOscillatorNode, any> {
        return {
            typeId: SineOscillatorNode.ID,
            label: "Sine Oscillator",
            createNew(project, context, nodeId) {
                return new SineOscillatorNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                return new SineOscillatorNode(nodeId, project.workspace.audio);
            }
        };
    };
}

GlobalRegistries.NODE_FACTORIES.register(SineOscillatorNode.ID, SineOscillatorNode.createFactory());