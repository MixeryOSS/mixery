import { AudioSourceNode, IPort, Identifier, MidiPort, Note, NotesSourceNode, PortsConnection, Project } from "../index.js";
import { INode, INodeAny } from "./INode.js";

export class NodesNetwork {
    nodes: INode<any, any>[] = [];
    connections: PortsConnection[] = [];
    networkName = "Main";

    #idGenCounter = 0;
    generateNodeId() {
        return `snowflake-${Date.now()}-${this.#idGenCounter++}`;
    }

    connect(from: IPort<any>, to: IPort<any>) {
        if (from.connectedTo.has(to)) return false;
        if (from.onConnectedToPort(to)) this.connections.push({
            from: [from.node.nodeId, from.portId],
            to: [to.node.nodeId, to.portId]
        });
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
            connections: structuredClone(this.connections)
        };

        this.nodes.forEach(node => {
            saved.nodes[node.nodeId] = {
                nodeType: node.typeId,
                data: node.saveNode(),
                nodeX: node.nodeX,
                nodeY: node.nodeY
            };
        });

        return saved;
    }

    async load(saved: SavedNodesNetwork, project: Project) {
        this.connections = structuredClone(saved.connections);

        await Promise.all(Object.keys(saved.nodes).map(async nodeId => {
            let savedNode = saved.nodes[nodeId];
            let factory = project.workspace.registries.nodeFactories.get(savedNode.nodeType);
            if (!factory) {
                console.warn(`[NodesNetwork] Unable to load ${savedNode.nodeType}: Unknown type`);
                return;
            }

            let node = await factory.createExisting(
                project,
                nodeId,
                savedNode.data
            );
            
            node.nodeX = savedNode.nodeX;
            node.nodeY = savedNode.nodeY;
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

            this.connect(fromPort, toPort);
        });

        return this;
    }
}

export interface SavedNodesNetwork {
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