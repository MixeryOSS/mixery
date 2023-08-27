import { GlobalRegistries, IPort, Identifier, MidiPort } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

interface NoteClipNodeData {
    channelName: string;
}

export class NoteClipNode implements INode<NoteClipNode, NoteClipNodeData> {
    static readonly ID = "mixery:note_clip";
    typeId: Identifier = NoteClipNode.ID;
    nodeName?: string = "MIDI";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    data: NoteClipNodeData = {
        channelName: "default"
    };

    controls: NodeControl<any>[] = [];
    inputs: IPort<any>[] = [];
    outputs: IPort<any>[] = [];

    midiOut = new MidiPort(this, "midiOut");

    constructor(readonly nodeId: string) {
        const self = this;
        this.controls.push({
            label: "Clip Channel",
            get value(): string { return self.data.channelName; },
            set value(v: string) { self.data.channelName = v; }
        });

        this.outputs.push(this.midiOut);
        this.midiOut.portName = "MIDI Signal";
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

    saveNode(): NoteClipNodeData {
        return structuredClone(this.data);
    }

    static createFactory(): NodeFactory<NoteClipNode, NoteClipNodeData> {
        return {
            typeId: NoteClipNode.ID,
            createNew(workspace, nodeId) {
                return new NoteClipNode(nodeId);
            },
            createExisting(workspace, nodeId, data) {
                let node = new NoteClipNode(nodeId);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(NoteClipNode.ID, NoteClipNode.createFactory());