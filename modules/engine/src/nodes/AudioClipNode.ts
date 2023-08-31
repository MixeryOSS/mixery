import { GlobalRegistries, IPort, Identifier, MidiPort, SignalPort, Workspace } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

interface AudioClipNodeData {
    channelName: string;
}

export class AudioClipNode implements INode<AudioClipNode, AudioClipNodeData> {
    static readonly ID = "mixery:audio_clip";
    typeId: Identifier = AudioClipNode.ID;
    nodeName?: string = "Audio Clip Input";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    data: AudioClipNodeData = {
        channelName: "Default Channel"
    };

    controls: NodeControl<any>[] = [];
    inputs: IPort<any>[] = [];
    outputs: IPort<any>[] = [];

    audioGain: SignalPort;
    audioOut: SignalPort;

    constructor(readonly nodeId: string, audio: BaseAudioContext) {
        const self = this;
        this.controls.push({
            label: "Clip Channel",
            get value(): string { return self.data.channelName; },
            set value(v: string) { self.data.channelName = v; }
        });

        this.audioOut = new SignalPort(this, "audioOut", audio.createGain());
        this.audioOut.portName = "Audio";
        this.outputs.push(this.audioOut);

        this.audioGain = new SignalPort(this, "audioGain", (this.audioOut.socket as GainNode).gain);
        this.audioGain.portName = "Gain";
        this.inputs.push(this.audioGain);
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return this.inputs;
    }

    getOutputPorts(): IPort<any>[] {
        return this.outputs;
    }

    saveNode(): AudioClipNodeData {
        return structuredClone(this.data);
    }

    static createFactory(): NodeFactory<AudioClipNode, AudioClipNodeData> {
        return {
            typeId: AudioClipNode.ID,
            label: "Audio Clip Input",
            createNew(project, nodeId) {
                return new AudioClipNode(nodeId, project.workspace.audio);
            },
            createExisting(project, nodeId, data) {
                const node = new AudioClipNode(nodeId, project.workspace.audio);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(AudioClipNode.ID, AudioClipNode.createFactory());