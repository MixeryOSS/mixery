import { GlobalRegistries, IPort, Identifier, MidiPort, NodesNetwork, SavedNodesNetwork, SignalPort } from "../../index.js";
import { INode, NodeControl, NodeFactory } from "../INode.js";
import { GroupIONode, GroupInputsNode, GroupOutputsNode } from "./GroupIONode.js";

interface GroupNodeSavedData {
    children: SavedNodesNetwork;
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

    constructor(public readonly nodeId: string, audioContext: BaseAudioContext) {
        this.children = new NodesNetwork(audioContext.createGain());
        this.children.networkName = "Group";

        this.inputs = new GroupInputsNode(); this.inputs.group = this;
        this.outputs = new GroupOutputsNode(); this.outputs.group = this;
        this.children.nodes.push(this.inputs, this.outputs);
    }

    getControls(): NodeControl<any>[] {
        return [];
    }

    getInputPorts(): IPort<any>[] {
        return this.inputs.outsideNetwork;
    }
    
    getOutputPorts(): IPort<any>[] {
        return this.outputs.outsideNetwork;
    }

    saveNode(): GroupNodeSavedData {
        return { children: this.children.save() };
    }

    static createFactory(): NodeFactory<GroupNode, GroupNodeSavedData> {
        // TODO
        return {
            typeId: GroupNode.ID,
            label: "Group",
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