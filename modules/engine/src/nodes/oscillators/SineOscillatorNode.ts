import { GlobalRegistries } from "../../index.js";
import { Identifier } from "../../types.js";
import { INode, NodeControl, NodeControls, NodeFactory } from "../INode.js";
import { IPort } from "../ports/IPort.js";
import { MidiPort } from "../ports/MidiPort.js";
import { SignalPort } from "../ports/SignalPort.js";

interface SineOscillatorData {
    gain: number;
    frequency: number;
    detune: number;
}

export class SineOscillatorNode implements INode<SineOscillatorNode, SineOscillatorData> {
    static readonly ID = "mixery:sine_oscillator";
    typeId: Identifier = SineOscillatorNode.ID;
    nodeName?: string = "Sine Oscillator";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    controls: NodeControl<any>[] = [];

    triggerIn: MidiPort;
    gainIn: SignalPort;
    freqIn: SignalPort;
    detuneIn: SignalPort;

    audioOut: SignalPort;

    playingNotes: Map<bigint, OscillatorNode> = new Map();

    #freq: ConstantSourceNode;
    #detune: ConstantSourceNode;

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        this.triggerIn = new MidiPort(this, "triggerIn");
        this.triggerIn.portName = "Trigger";

        this.freqIn = new SignalPort(this, "freqIn", audio, (this.#freq = audio.createConstantSource()).offset);
        this.freqIn.portName = "Frequency";
        this.#freq.offset.value = 440;
        this.#freq.start();

        this.detuneIn = new SignalPort(this, "detuneIn", audio, (this.#detune = audio.createConstantSource()).offset);
        this.detuneIn.portName = "Detune";
        this.#detune.offset.value = 0;
        this.#detune.start();

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
                this.#freq.connect(osc.frequency);
                this.#detune.connect(osc.detune);
                osc.connect(this.audioOut.socket as GainNode);
                osc.start(audio.currentTime + delay);
                this.playingNotes.set(uid, osc);
            } else if (note.eventType == "keyup" && this.playingNotes.has(uid)) {
                const osc = this.playingNotes.get(uid);
                osc.stop(audio.currentTime + delay);
                osc.addEventListener("ended", () => {
                    this.playingNotes.delete(uid);
                });
            }
        });

        this.controls.push(NodeControls.makeParamControl("Gain", (this.audioOut.socket as GainNode).gain));
        this.controls.push(NodeControls.makeParamControl("Frequency", this.#freq.offset));
        this.controls.push(NodeControls.makeParamControl("Detune", this.#detune.offset));
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return [this.triggerIn, this.gainIn, this.freqIn, this.detuneIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.audioOut];
    }

    saveNode(): SineOscillatorData {
        return {
            gain: (this.gainIn.socket as AudioParam).value,
            frequency: this.#freq.offset.value,
            detune: this.#detune.offset.value
        };
    }

    createCopy(): SineOscillatorNode {
        const node = new SineOscillatorNode(this.nodeId, (this.audioOut.socket as AudioNode).context);
        (node.gainIn.socket as AudioParam).value = (this.gainIn.socket as AudioParam).value;
        node.#freq.offset.value = this.#freq.offset.value;
        node.#detune.offset.value = this.#detune.offset.value;
        return node;
    }

    static createFactory(): NodeFactory<SineOscillatorNode, SineOscillatorData> {
        return {
            typeId: SineOscillatorNode.ID,
            label: "Sine Oscillator",
            createNew(project, context, nodeId) {
                return new SineOscillatorNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new SineOscillatorNode(nodeId, project.workspace.audio);
                (node.gainIn.socket as AudioParam).value = data.gain;
                node.#freq.offset.value = data.frequency;
                node.#detune.offset.value = data.detune;
                return node;
            }
        };
    };
}

GlobalRegistries.NODE_FACTORIES.register(SineOscillatorNode.ID, SineOscillatorNode.createFactory());