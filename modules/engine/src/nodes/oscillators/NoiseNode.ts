import { GlobalRegistries } from "../../index.js";
import { Identifier } from "../../types.js";
import { INode, NodeControl, NodeFactory } from "../INode.js";
import { IPort } from "../ports/IPort.js";
import { SignalPort } from "../ports/SignalPort.js";

const GLOBAL_NOISE = new AudioBuffer({
    sampleRate: 48000,
    numberOfChannels: 2,
    length: 48000 * 5 // Noise for 5 seconds
});

for (let ch = 0; ch < 2; ch++) {
    const data = GLOBAL_NOISE.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

export class NoiseNode implements INode<NoiseNode, any> {
    static readonly ID = "mixery:noise";
    typeId: Identifier = NoiseNode.ID;
    nodeName?: string = "Noise";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    audioOut: SignalPort;

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        const source = audio.createBufferSource();
        source.loop = true;
        source.buffer = GLOBAL_NOISE;
        source.start();

        this.audioOut = new SignalPort(this, "audioOut", audio, source);
        this.audioOut.portName = "Noise";
    }

    getControls(): NodeControl<any>[] {
        return [];
    }

    getInputPorts(): IPort<any>[] {
        return [];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.audioOut];
    }

    saveNode() {
        return 0;
    }

    createCopy(): NoiseNode {
        return new NoiseNode(this.nodeId, (this.audioOut.socket as AudioBufferSourceNode).context);
    }

    destroy(): void {
        const source = this.audioOut.socket as AudioBufferSourceNode;
        source.stop();
    }

    static createFactory(): NodeFactory<NoiseNode, any> {
        return {
            typeId: NoiseNode.ID,
            label: "Noise",
            category: "Generators",
            createNew(project, context, nodeId) {
                return new NoiseNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                return new NoiseNode(nodeId, project.workspace.audio);
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(NoiseNode.ID, NoiseNode.createFactory());