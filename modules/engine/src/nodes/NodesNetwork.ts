import { AudioSourceNode, IPort, Identifier, MidiPort, Note, NotesSourceNode, PortsConnection, Project } from "../index.js";
import { UniqueID } from "../misc/UniqueID.js";
import { INode, INodeAny } from "./INode.js";

export class NodesNetwork {
    nodes: INode<any, any>[] = [];
    connections: PortsConnection[] = [];

    networkName = "Main";
    viewX: number = 0;
    viewY: number = 0;

    constructor(public readonly audioOut: AudioNode) {}

    generateNodeId() {
        return `uid-${UniqueID.generate()}`;
    }

    connect(from: IPort<any>, to: IPort<any>, isLoading: boolean = false) {
        if (from.connectedTo.has(to)) return false;
        if (from.onConnectedToPort(to)) {
            if (!isLoading) this.connections.push({
                from: [from.node.nodeId, from.portId],
                to: [to.node.nodeId, to.portId]
            });
        }
        return true;
    }

    disconnect(from: IPort<any>, to: IPort<any>) {
        if (from.connectedTo.has(to)) {
            if (from.onDisconnectedFromPort(to)) {
                const idx = this.connections.findIndex(v => (
                    v.from[0] == from.node.nodeId && v.from[1] == from.portId &&
                    v.to[0] == to.node.nodeId && v.to[1] == to.portId
                ));
                if (idx != -1) this.connections.splice(idx, 1);
                return true;
            }
        }

        return false;
    }

    select(nodeId: string): INodeAny | undefined;
    select(nodeId: string, portId: string): IPort<any> | undefined;
    select(nodeId: string, portId?: string): INodeAny | IPort<any> | undefined {
        const node = this.nodes.find(v => v.nodeId == nodeId);
        if (!node) return undefined;
        if (!portId) return node;
        const ports = [...node.getInputPorts(), ...node.getOutputPorts()];
        const port = ports.find(v => v.portId == portId);
        return port;
    }

    sendNoteSignal(channel: string, event: Note) {
        const node = this.nodes.find(v => v instanceof NotesSourceNode && v.data.channelName == channel);
        if (!node) return false;
        ((node as NotesSourceNode).outputs[0] as MidiPort).emitNote(event);
    }

    getAudioSourceNode(channel: string) {
        const node = this.nodes.find(v => v instanceof AudioSourceNode && v.data.channelName == channel);
        return node as AudioSourceNode;
    }

    save() {
        let saved: SavedNodesNetwork = {
            nodes: {},
            viewX: this.viewX,
            viewY: this.viewY,
            connections: structuredClone(this.connections)
        };

        this.nodes.forEach(node => {
            saved.nodes[node.nodeId] = {
                nodeType: node.typeId,
                data: node.saveNode(),
                nodeX: node.nodeX,
                nodeY: node.nodeY,
                nodeName: node.nodeName,
            };
        });

        return saved;
    }

    async load(saved: SavedNodesNetwork, project: Project) {
        this.viewX = saved.viewX ?? 0;
        this.viewY = saved.viewY ?? 0;
        this.connections = structuredClone(saved.connections);
        const context: NodesNetworkContext = { audioOut: this.audioOut };

        await Promise.all(Object.keys(saved.nodes).map(async nodeId => {
            let savedNode = saved.nodes[nodeId];
            let factory = project.workspace.registries.nodeFactories.get(savedNode.nodeType);
            if (!factory) {
                console.warn(`[NodesNetwork] Unable to load ${savedNode.nodeType}: Unknown type`);
                return;
            }

            let node = await factory.createExisting(
                project,
                context,
                nodeId,
                savedNode.data
            ) as INodeAny;

            node.nodeX = savedNode.nodeX;
            node.nodeY = savedNode.nodeY;
            if (savedNode.nodeName) node.nodeName = savedNode.nodeName;
            this.nodes.push(node);
        }));

        this.connections.forEach(c => {
            let fromNode = this.nodes.find(v => v.nodeId == c.from[0]);
            let toNode = this.nodes.find(v => v.nodeId == c.to[0]);
            if (!fromNode || !toNode) {
                console.warn(`[NodesNetwork] Unable to link ${c.from.join("/")} => ${c.to.join("/")}`);
                return;
            }

            let fromPort = fromNode.getOutputPorts().find(v => v.portId == c.from[1]);
            let toPort = toNode.getInputPorts().find(v => v.portId == c.to[1]);
            if (!fromPort || !toPort) {
                console.warn(`[NodesNetwork] Unable to link ${c.from.join("/")} => ${c.to.join("/")}`);
                return;
            }

            this.connect(fromPort, toPort, true);
        });

        return this;
    }

    destroy() {
        this.nodes.forEach(node => { if (node.destroy) node.destroy(); });
    }
}

export interface SavedNodesNetwork {
    viewX: number;
    viewY: number;
    nodes: Record<string, SavedNode>;
    connections: PortsConnection[];
}

interface SavedNode {
    nodeType: Identifier;
    nodeName?: string;
    nodeX: number;
    nodeY: number;
    data: any;
}

export interface NodesNetworkContext {
    readonly audioOut: AudioNode;
}