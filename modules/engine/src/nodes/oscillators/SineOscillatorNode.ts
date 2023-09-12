import { GlobalRegistries } from "../../index.js";
import { Identifier } from "../../types.js";
import { INode, NodeControl, NodeControls, NodeFactory } from "../INode.js";
import { IPort } from "../ports/IPort.js";
import { SignalPort } from "../ports/SignalPort.js";

interface SineOscillatorData {
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

    freqIn: SignalPort;
    detuneIn: SignalPort;

    audioOut: SignalPort;

    #freq: ConstantSourceNode;
    #detune: ConstantSourceNode;

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        this.freqIn = new SignalPort(this, "freqIn", audio, (this.#freq = audio.createConstantSource()).offset);
        this.freqIn.portName = "Frequency";
        this.#freq.offset.value = 440;
        this.#freq.start();

        this.detuneIn = new SignalPort(this, "detuneIn", audio, (this.#detune = audio.createConstantSource()).offset);
        this.detuneIn.portName = "Detune";
        this.#detune.offset.value = 0;
        this.#detune.start();

        this.audioOut = new SignalPort(this, "audioOut", audio, audio.createOscillator());
        this.audioOut.portName = "Audio";
        (this.audioOut.socket as OscillatorNode).type = "sine";
        this.#freq.connect((this.audioOut.socket as OscillatorNode).frequency);
        this.#detune.connect((this.audioOut.socket as OscillatorNode).detune);
        (this.audioOut.socket as OscillatorNode).start();

        this.controls.push(NodeControls.makeParamControl("Frequency (Hz)", this.#freq.offset, 0));
        this.controls.push(NodeControls.makeParamControl("Detune (cents)", this.#detune.offset));
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return [this.freqIn, this.detuneIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.audioOut];
    }

    saveNode(): SineOscillatorData {
        return {
            frequency: this.#freq.offset.value,
            detune: this.#detune.offset.value
        };
    }

    createCopy(): SineOscillatorNode {
        const node = new SineOscillatorNode(this.nodeId, (this.audioOut.socket as AudioNode).context);
        node.#freq.offset.value = this.#freq.offset.value;
        node.#detune.offset.value = this.#detune.offset.value;
        return node;
    }

    static createFactory(): NodeFactory<SineOscillatorNode, SineOscillatorData> {
        return {
            typeId: SineOscillatorNode.ID,
            label: "Sine Oscillator",
            category: "Generators",
            createNew(project, context, nodeId) {
                return new SineOscillatorNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new SineOscillatorNode(nodeId, project.workspace.audio);
                node.#freq.offset.value = data.frequency;
                node.#detune.offset.value = data.detune;
                return node;
            }
        };
    };
}

GlobalRegistries.NODE_FACTORIES.register(SineOscillatorNode.ID, SineOscillatorNode.createFactory());