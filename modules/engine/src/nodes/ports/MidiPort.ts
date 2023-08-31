import { Note } from "../../midi/Note.js";
import { IEmitter, SimpleEmitter } from "../../misc/Emitter.js";
import { Identifier } from "../../types.js";
import { INode, INodeAny } from "../INode.js";
import { IPort } from "./IPort.js";

export class MidiPort implements IPort<MidiPort> {
    readonly type: Identifier = "mixery:midi";
    portName?: string;
    connectedTo: Set<MidiPort> = new Set();

    // Emitters
    readonly onNoteEvent: IEmitter<Note> = new SimpleEmitter();

    constructor(readonly node: INode<any, any>, readonly portId: string) {}

    onConnectedToPort(port: MidiPort) {
        this.connectedTo.add(port);
        return true;
    }

    onDisconnectedFromPort(port: MidiPort) {
        return this.connectedTo.delete(port);
    }

    emitNote(note: Note) {
        this.onNoteEvent.emit(note);
        this.connectedTo.forEach(c => c.emitNote(note));
    }

    makeBridge(outToIn: boolean, nodeInside: INodeAny, idInside: string, nodeOutside: INodeAny, idOutside: string): { inside: MidiPort; outside: MidiPort; } {
        return {
            inside: new MidiPort(nodeInside, idInside),
            outside: new MidiPort(nodeOutside, idOutside)
        };
    }
}