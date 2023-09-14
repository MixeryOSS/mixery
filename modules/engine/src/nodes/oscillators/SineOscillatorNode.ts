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

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        this.audioOut = new SignalPort(this, "audioOut", audio, audio.createOscillator());
        this.audioOut.portName = "Audio";
        (this.audioOut.socket as OscillatorNode).type = "sine";
        (this.audioOut.socket as OscillatorNode).start();

        this.freqIn = new SignalPort(this, "freqIn", audio, (this.audioOut.socket as OscillatorNode).frequency);
        this.freqIn.portName = "Frequency";

        this.detuneIn = new SignalPort(this, "detuneIn", audio, (this.audioOut.socket as OscillatorNode).detune);
        this.detuneIn.portName = "Detune";

        this.controls.push(NodeControls.makeParamControl("Frequency (Hz)", (this.audioOut.socket as OscillatorNode).frequency, 0));
        this.controls.push(NodeControls.makeParamControl("Detune (cents)", (this.audioOut.socket as OscillatorNode).detune));
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
            frequency: (this.audioOut.socket as OscillatorNode).frequency.value,
            detune: (this.audioOut.socket as OscillatorNode).detune.value
        };
    }

    createCopy(): SineOscillatorNode {
        const node = new SineOscillatorNode(this.nodeId, (this.audioOut.socket as AudioNode).context);
        (node.freqIn.socket as AudioParam).value = (this.freqIn.socket as AudioParam).value;
        (node.detuneIn.socket as AudioParam).value = (this.detuneIn.socket as AudioParam).value;
        return node;
    }

    destroy(): void {
        (this.audioOut.socket as OscillatorNode).stop();
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
                (node.freqIn.socket as AudioParam).value = data.frequency;
                (node.detuneIn.socket as AudioParam).value = data.detune;
                return node;
            }
        };
    };
}

GlobalRegistries.NODE_FACTORIES.register(SineOscillatorNode.ID, SineOscillatorNode.createFactory());