import { GlobalRegistries, IPort, Identifier, MidiPort, NodesNetwork, NotesSourceNode, SavedNodesNetwork, SignalPort, SpeakerNode } from "../../index.js";
import { INode, INodeAny, NodeControl, NodeControls, NodeFactory } from "../INode.js";
import { GroupIONode, GroupInputsNode, GroupOutputsNode } from "./GroupIONode.js";

interface GroupNodeSavedData {
    children: SavedNodesNetwork;
}

interface SynthPlayingNote {
    callbackThing: ConstantSourceNode;
    group: GroupNode;
}

/**
 * Group node is a special node that groups a bunch of nodes.
 * 
 * There's a restriction applied to groups:
 * - `AudioSourceNode` and `NotesSourceNode` does not pick up inputs from playlist or user's
 * devices.
*/
export class GroupNode implements INode<GroupNode, GroupNodeSavedData> {
    static readonly ID = "mixery:group";
    typeId: Identifier = GroupNode.ID;
    get nodeName() { return this.children.networkName; }
    set nodeName(v) { this.children.networkName = v; }
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    children: NodesNetwork;
    inputs: GroupInputsNode;
    outputs: GroupOutputsNode;
    synthControls: NodeControl<any>[] = [];

    // Synth mode
    // Automatically applied when both Notes Source Input and Speaker Output nodes present
    synthMidiIn: MidiPort;
    synthAudioOut: SignalPort;
    synthAudioGain: SignalPort;
    get isSynth() {
        if (!this.children.nodes.find(v => v.typeId == NotesSourceNode.ID)) return false;
        if (!this.children.nodes.find(v => v.typeId == SpeakerNode.ID)) return false;
        return true;
    }

    synthPlayingNotes: Map<bigint, SynthPlayingNote> = new Map();

    constructor(public readonly nodeId: string, audioContext: BaseAudioContext) {
        this.children = new NodesNetwork(audioContext.createGain());
        this.children.networkName = "Group";

        this.inputs = new GroupInputsNode(); this.inputs.group = this;
        this.outputs = new GroupOutputsNode(); this.outputs.group = this;
        this.children.nodes.push(this.inputs, this.outputs);

        this.synthMidiIn = new MidiPort(this, "synthMidiIn");
        this.synthMidiIn.portName = "MIDI (Synth)";

        this.synthAudioOut = new SignalPort(this, "synthAudioOut", audioContext, audioContext.createGain());
        this.synthAudioOut.portName = "Audio (Synth)";

        this.synthAudioGain = new SignalPort(this, "synthAudioGain", audioContext, (this.synthAudioOut.socket as GainNode).gain);
        this.synthAudioGain.portName = "Gain (Synth)";

        this.synthMidiIn.onNoteEvent.listen(note => {
            const { uid } = note;
            const delay = note.signalType == "instant"? 0 : note.delayMs / 1000;
            const destination = this.synthAudioOut.socket as GainNode;

            if (!this.synthPlayingNotes.has(uid) && note.eventType == "keydown") {
                const synthNote: SynthPlayingNote = {
                    callbackThing: this.children.audioOut.context.createConstantSource(),
                    group: this.createCopy()
                };
                synthNote.group.children.audioOut.connect(destination);
                synthNote.group.children.sendNoteSignal("Default Channel", note);
                synthNote.callbackThing.start(this.children.audioOut.context.currentTime + delay);
                this.synthPlayingNotes.set(uid, synthNote);
            } else if (this.synthPlayingNotes.has(uid) && note.eventType == "keyup") {
                const synthNote = this.synthPlayingNotes.get(uid);
                synthNote.group.children.sendNoteSignal("Default Channel", note);
                synthNote.callbackThing.addEventListener("ended", () => {
                    synthNote.group.children.audioOut.disconnect(destination);
                    synthNote.group.destroy();
                });
                const releaseTime = Math.max(...synthNote.group.children.nodes.map(v => v.calculateReleaseTime? v.calculateReleaseTime() : 0));
                synthNote.callbackThing.stop(this.children.audioOut.context.currentTime + delay + releaseTime / 1000);
                this.synthPlayingNotes.delete(uid);
            }
        });

        this.synthControls.push(NodeControls.makeParamControl("Gain", this.synthAudioGain.socket as AudioParam));
    }

    getControls(): NodeControl<any>[] {
        return this.isSynth? this.synthControls : [];
    }

    getInputPorts(): IPort<any>[] {
        if (this.isSynth) return [this.synthMidiIn, this.synthAudioGain];
        return this.inputs.outsideNetwork;
    }
    
    getOutputPorts(): IPort<any>[] {
        if (this.isSynth) return [this.synthAudioOut];
        return this.outputs.outsideNetwork;
    }

    saveNode(): GroupNodeSavedData {
        return { children: this.children.save() };
    }

    createCopy(): GroupNode {
        const node = new GroupNode(this.nodeId, this.children.audioOut.context);
        node.nodeName = `${this.nodeName} - Copy`;

        this.children.nodes.forEach(childToCopy => {
            if (childToCopy instanceof GroupIONode) return; // TODO replicate io node to clone
            const copiedChild = childToCopy.createCopy(node.children) as INodeAny;
            node.children.nodes.push(copiedChild);
        });

        this.children.connections.forEach(conn => {
            const from = node.children.select(conn.from[0], conn.from[1]);
            const to = node.children.select(conn.to[0], conn.to[1]);
            if (!from || !to) return;
            node.children.connect(from, to, false);
        });

        (node.synthAudioGain.socket as AudioParam).value = (this.synthAudioGain.socket as AudioParam).value;
        return node;
    }

    destroy(): void {
        this.children.destroy();
    }

    static createFactory(): NodeFactory<GroupNode, GroupNodeSavedData> {
        // TODO
        return {
            typeId: GroupNode.ID,
            label: "Group",
            category: "Specials",
            createNew(project, context, nodeId) {
                return new GroupNode(nodeId, project.workspace.audio);
            },
            async createExisting(project, context, nodeId, data) {
                const node = new GroupNode(nodeId, project.workspace.audio);
                node.children.nodes = [];
                await node.children.load(data.children, project);
                node.inputs = node.children.nodes.find(v => v.nodeId == "inputs") as GroupInputsNode;
                node.outputs = node.children.nodes.find(v => v.nodeId == "outputs") as GroupOutputsNode;
                node.inputs.group = node;
                node.outputs.group = node;
                node.inputs.postNodeCreation(project.workspace.audio);
                node.outputs.postNodeCreation(project.workspace.audio);
                
                // Linking step
                const fromInputsConn = data.children.connections.filter(v => v.from[0] == "inputs");
                fromInputsConn.forEach(wire => {
                    const portFrom = node.inputs.getOutputPorts().find(v => v.portId == wire.from[1]);
                    if (!portFrom) return;

                    const portTo = node.children.select(wire.to[0], wire.to[1]);
                    if (!portTo) return;

                    portFrom.onConnectedToPort(portTo);
                });

                const toOutputsConn = data.children.connections.filter(v => v.to[0] == "outputs");
                toOutputsConn.forEach(wire => {
                    const portFrom = node.children.select(wire.from[0], wire.from[1]);
                    if (!portFrom) return;

                    const portTo = node.outputs.getInputPorts().find(v => v.portId == wire.to[1]);
                    if (!portTo) return;

                    portFrom.onConnectedToPort(portTo);
                });

                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(GroupNode.ID, GroupNode.createFactory());