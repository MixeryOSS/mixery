import { GlobalRegistries, IPort, Identifier, MidiPort, SignalPort, Temperaments } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

interface UnpackNoteNodeData {
    temperament: "equal";
}

/**
 * Unpack MIDI note data into frequency signal and velocity signal. This node was meant to be used
 * inside synth nodes and should not be used in global nodes network.
*/
export class UnpackNoteNode implements INode<UnpackNoteNode, UnpackNoteNodeData> {
    static readonly ID = "mixery:unpack_note";
    typeId: Identifier = UnpackNoteNode.ID;
    nodeName?: string = "Unpack Note";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;
    data: UnpackNoteNodeData = {
        temperament: "equal"
    };

    midiIn: MidiPort;
    freqOut: SignalPort;
    velocityOut: SignalPort;

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        this.midiIn = new MidiPort(this, "midiIn");
        this.midiIn.portName = "MIDI";

        this.freqOut = new SignalPort(this, "frequency", audio, audio.createConstantSource());
        this.freqOut.portName = "Frequency";

        this.velocityOut = new SignalPort(this, "velocity", audio, audio.createConstantSource());
        this.velocityOut.portName = "Velocity";

        (this.freqOut.socket as ConstantSourceNode).offset.value = 0;
        (this.freqOut.socket as ConstantSourceNode).start();

        (this.velocityOut.socket as ConstantSourceNode).offset.value = 0;
        (this.velocityOut.socket as ConstantSourceNode).start();

        this.midiIn.onNoteEvent.listen(note => {
            if (note.eventType == "keyup") return;
            const delay = note.signalType == "instant"? 0 : note.delayMs / 1000;
            const atTime = audio.currentTime + delay;

            let temperament: Temperaments.Temperament;
            switch (this.data) {
                default: temperament = Temperaments.EQUAL; break;
            }

            const freq = temperament.getFrequency(note.midiIndex, 69, 440);
            const vel = note.velocity;

            (this.freqOut.socket as ConstantSourceNode).offset.setValueAtTime(freq, atTime);
            (this.velocityOut.socket as ConstantSourceNode).offset.setValueAtTime(vel, atTime);
        });
    }

    getControls(): NodeControl<any>[] {
        return [];
    }

    getInputPorts(): IPort<any>[] {
        return [this.midiIn];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.freqOut, this.velocityOut];
    }

    saveNode(): UnpackNoteNodeData {
        return structuredClone(this.data);
    }

    createCopy(): UnpackNoteNode {
        const node = new UnpackNoteNode(this.nodeId, (this.freqOut.socket as ConstantSourceNode).context);
        node.data = structuredClone(this.data);
        return node;
    }

    static createFactory(): NodeFactory<UnpackNoteNode, UnpackNoteNodeData> {
        return {
            typeId: UnpackNoteNode.ID,
            label: "Unpack Note",
            category: "Synthesizers",
            createNew(project, context, nodeId) {
                return new UnpackNoteNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new UnpackNoteNode(nodeId, project.workspace.audio);
                node.data = structuredClone(data);
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(UnpackNoteNode.ID, UnpackNoteNode.createFactory());