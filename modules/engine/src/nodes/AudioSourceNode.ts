import { GlobalRegistries, IPort, Identifier, MidiPort, SignalPort, Workspace } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

interface AudioSourceNodeData {
    channelName: string;
}

export class AudioSourceNode implements INode<AudioSourceNode, AudioSourceNodeData> {
    static readonly ID = "mixery:audio_source";
    typeId: Identifier = AudioSourceNode.ID;
    nodeName?: string = "Audio Source";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    data: AudioSourceNodeData = {
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
            label: "Channel",
            get value(): string { return self.data.channelName; },
            set value(v: string) { self.data.channelName = v; }
        });

        this.audioOut = new SignalPort(this, "audioOut", audio, audio.createGain());
        this.audioOut.portName = "Output";
        this.outputs.push(this.audioOut);

        this.audioGain = new SignalPort(this, "audioGain", audio, (this.audioOut.socket as GainNode).gain);
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

    saveNode(): AudioSourceNodeData {
        return structuredClone(this.data);
    }

    static createFactory(): NodeFactory<AudioSourceNode, AudioSourceNodeData> {
        return {
            typeId: AudioSourceNode.ID,
            label: "Audio Source",
            createNew(project, nodeId) {
                return new AudioSourceNode(nodeId, project.workspace.audio);
            },
            createExisting(project, nodeId, data) {
                const node = new AudioSourceNode(nodeId, project.workspace.audio);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(AudioSourceNode.ID, AudioSourceNode.createFactory());