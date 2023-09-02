import { GlobalRegistries, IPort, Identifier, MidiPort } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

export class DebugNode implements INode<DebugNode, any> {
    static readonly ID = "mixery:debug";
    typeId: Identifier = DebugNode.ID;
    nodeName?: string = "Debug";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    midiIn: MidiPort;
    midiOut: MidiPort;
    midiTrigger: NodeControl<string>;

    constructor(public readonly nodeId: string) {
        const self = this;
        this.midiIn = new MidiPort(this, "midiIn");
        this.midiIn.portName = "MIDI In";

        this.midiOut = new MidiPort(this, "midiOut");
        this.midiOut.portName = "MIDI Out";
        
        this.midiTrigger = {
            label: "Type to trigger",
            get value() { return ""; },
            set value(v) {
                self.midiOut.emitNote({
                    signalType: "instant",
                    eventType: "keydown",
                    midiIndex: 69,
                    velocity: 0.8
                });
            }
        };

        this.midiIn.onNoteEvent.listen(note => console.log("[DebugNode] Received MIDI", note));
    }

    getControls(): NodeControl<any>[] {
        return [this.midiTrigger];
    }

    getInputPorts(): IPort<any>[] {
        return [this.midiIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.midiOut];
    }

    saveNode() {
        return {};
    }

    createCopy(): DebugNode {
        return new DebugNode(this.nodeId);
    }

    static createFactory(): NodeFactory<DebugNode, any> {
        return {
            typeId: DebugNode.ID,
            label: "Debug",
            createNew(project, context, nodeId) {
                return new DebugNode(nodeId);
            },
            createExisting(project, context, nodeId, data) {
                return new DebugNode(nodeId);
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(DebugNode.ID, DebugNode.createFactory());