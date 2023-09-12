import { GlobalRegistries, IPort, Identifier, MidiPort, SignalPort, Temperaments } from "../index.js";
import { INode, NodeControl, NodeControls, NodeFactory } from "./INode.js";

interface PluckNodeData {
    duration: number;
}

export class PluckNode implements INode<PluckNode, any> {
    static readonly ID = "mixery:pluck";
    typeId: Identifier = PluckNode.ID;
    nodeName?: string = "Pluck";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    data: PluckNodeData = {
        duration: 0.2
    };

    controls: NodeControl<any>[] = [];
    inputs: IPort<any>[] = [];
    outputs: IPort<any>[] = [];

    midiIn: MidiPort;
    audioGain: SignalPort;
    audioOut: SignalPort;

    constructor(public readonly nodeId: string, audioContext: BaseAudioContext) {
        this.midiIn = new MidiPort(this, "midiIn");
        this.midiIn.portName = "MIDI";
        this.inputs.push(this.midiIn);

        this.audioOut = new SignalPort(this, "audioOut", audioContext, audioContext.createGain());
        this.audioOut.portName = "Audio";
        this.outputs.push(this.audioOut);

        this.audioGain = new SignalPort(this, "audioGain", audioContext, (this.audioOut.socket as GainNode).gain);
        this.audioGain.portName = "Gain";
        this.inputs.push(this.audioGain);

        this.midiIn.onNoteEvent.listen(note => {
            if (note.eventType != "keydown") return;
            const timeOffset = note.signalType == "instant"? 0 : (note.delayMs / 1000);
            
            let osc = audioContext.createOscillator();
            osc.frequency.value = Temperaments.EQUAL.getFrequency(note.midiIndex, 69, 440);

            let oscGain = audioContext.createGain();
            oscGain.gain.value = 0;
            oscGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + timeOffset + 0.001);
            oscGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + timeOffset + this.data.duration);

            osc.connect(oscGain);
            oscGain.connect(this.audioOut.socket as any);
            osc.start(audioContext.currentTime + timeOffset);
            osc.stop(audioContext.currentTime + timeOffset + this.data.duration);
        });

        const self = this;
        this.controls.push({
            label: "Duration (s)",
            get value() { return self.data.duration },
            set value(v) {self.data.duration = v; }
        });
        this.controls.push(NodeControls.makeParamControl("Gain", this.audioGain.socket as AudioParam));
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

    saveNode() {
        return structuredClone(this.data);
    }

    createCopy(): PluckNode {
        const node = new PluckNode(this.nodeId, (this.audioOut.socket as GainNode).context);
        node.data = structuredClone(this.data);
        (node.audioGain.socket as AudioParam).value = (this.audioGain.socket as AudioParam).value;
        return node;
    }

    static createFactory(): NodeFactory<PluckNode, PluckNodeData> {
        return {
            typeId: PluckNode.ID,
            label: "Pluck",
            category: "Instruments",
            createNew(project, context, nodeId) {
                return new PluckNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new PluckNode(nodeId, project.workspace.audio);
                node.data = data;
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(PluckNode.ID, PluckNode.createFactory());