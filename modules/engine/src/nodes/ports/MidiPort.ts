import { Note } from "../../midi/Note.js";
import { IEmitter, SimpleEmitter } from "../../misc/Emitter.js";
import { Identifier } from "../../types.js";
import { INode } from "../INode.js";
import { IPort } from "./IPort.js";

export class MidiPort implements IPort<MidiPort> {
    readonly type: Identifier = "mixery:midi";
    portName?: string;
    connectedTo: Set<MidiPort> = new Set();

    // Emitters
    readonly onNoteEvent: IEmitter<Note> = new SimpleEmitter();

    constructor(readonly node: INode<any, any>, readonly portId: string) {}

    onConnectedToPort(port: MidiPort): void {
        // NodesNetwork will automatically add port to connectedTo
    }

    onDisconnectedFromPort(port: MidiPort): void {
        // NodesNetwork will automatically remote port from connectedTo
    }

    emitNote(note: Note) {
        this.onNoteEvent.emit(note);
        this.connectedTo.forEach(c => c.emitNote(note));
    }
}