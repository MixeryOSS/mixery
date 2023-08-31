import { AudioClipNode, IPort, Identifier, MidiPort, Note, NoteClipNode, PortsConnection, Project } from "../index.js";
import { INode } from "./INode.js";

export class NodesNetwork {
    nodes: INode<any, any>[] = [];
    connections: PortsConnection[] = [];

    #idGenCounter = 0;
    generateNodeId() {
        return `snowflake-${Date.now()}-${this.#idGenCounter++}`;
    }

    connect(from: IPort<any>, to: IPort<any>) {
        if (from.connectedTo.has(to)) return false;

        this.connections.push({
            from: [from.node.nodeId, from.portId],
            to: [to.node.nodeId, to.portId]
        });

        from.onConnectedToPort(to);
        from.connectedTo.add(to);
        return true;
    }

    disconnect(from: IPort<any>, to: IPort<any>) {
        if (from.connectedTo.has(to)) {
            from.onDisconnectedFromPort(to);
            from.connectedTo.delete(to);

            const idx = this.connections.findIndex(v => (
                v.from[0] == from.node.nodeId && v.from[1] == from.portId &&
                v.to[0] == to.node.nodeId && v.to[1] == to.portId
            ));
            if (idx != -1) this.connections.splice(idx, 1);

            return true;
        }

        return false;
    }

    sendNoteSignal(channel: string, event: Note) {
        const node = this.nodes.find(v => v instanceof NoteClipNode && v.data.channelName == channel);
        if (!node) return false;
        ((node as NoteClipNode).outputs[0] as MidiPort).emitNote(event);
    }

    getAudioSourceNode(channel: string) {
        const node = this.nodes.find(v => v instanceof AudioClipNode && v.data.channelName == channel);
        return node as AudioClipNode;
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