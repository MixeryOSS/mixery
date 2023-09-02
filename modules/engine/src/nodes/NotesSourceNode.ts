import { GlobalRegistries, IPort, Identifier, MidiPort } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

interface NotesSourceNodeData {
    channelName: string;
}

export class NotesSourceNode implements INode<NotesSourceNode, NotesSourceNodeData> {
    static readonly ID = "mixery:notes_source";
    typeId: Identifier = NotesSourceNode.ID;
    nodeName?: string = "Notes Source";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    data: NotesSourceNodeData = {
        channelName: "Default Channel"
    };

    controls: NodeControl<any>[] = [];
    inputs: IPort<any>[] = [];
    outputs: IPort<any>[] = [];

    midiOut = new MidiPort(this, "midiOut");

    constructor(readonly nodeId: string) {
        const self = this;
        this.controls.push({
            label: "Channel",
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

    saveNode(): NotesSourceNodeData {
        return structuredClone(this.data);
    }

    static createFactory(): NodeFactory<NotesSourceNode, NotesSourceNodeData> {
        return {
            typeId: NotesSourceNode.ID,
            label: "Notes Source",
            createNew(workspace, context, nodeId) {
                return new NotesSourceNode(nodeId);
            },
            createExisting(workspace, context, nodeId, data) {
                const node = new NotesSourceNode(nodeId);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(NotesSourceNode.ID, NotesSourceNode.createFactory());