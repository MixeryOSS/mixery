import { GlobalRegistries } from "../../index.js";
import { Identifier } from "../../types.js";
import { INode, NodeControl, NodeFactory } from "../INode.js";
import { IPort } from "../ports/IPort.js";
import { MidiPort } from "../ports/MidiPort.js";
import { SignalPort } from "../ports/SignalPort.js";
import { GroupNode } from "./GroupNode.js";
import { GroupPlaceholderPort } from "./GroupPlaceholderPort.js";

type PortType = "midi" | "signal";

interface BridgedPortData {
    type: PortType;
    insideId: string;
    insideName?: string;
    outsideId: string;
    outsideName?: string;
}

interface GroupIONodeData {
    bridges: BridgedPortData[];
}

export abstract class GroupIONode implements INode<GroupIONode, GroupIONodeData> {
    insideNetwork: IPort<any>[] = [];
    outsideNetwork: IPort<any>[] = [];
    placeholder: GroupPlaceholderPort;
    group: GroupNode;
    canNotBeDeleted?: boolean = true;

    constructor(
        public readonly typeId: Identifier,
        public readonly nodeId: string,
        public readonly nodeName: string,
        public nodeX: number,
        public nodeY: number,
        public nodeWidth: number
    ) {
        this.placeholder = new GroupPlaceholderPort(this);
    }

    getControls(): NodeControl<any>[] { return []; }
    getInputPorts(): IPort<any>[] { return []; }
    getOutputPorts(): IPort<any>[] { return []; }

    saveNode(): GroupIONodeData {
        const bridges: BridgedPortData[] = [];

        for (let i = 0; i < this.insideNetwork.length; i++) {
            const inside = this.insideNetwork[i];
            const outside = this.outsideNetwork[i];
            let type: PortType;
            if (inside instanceof MidiPort) type = "midi";
            else if (inside instanceof SignalPort) type = "signal";
            else throw new Error(`Unable to save bridge for ${type.constructor.name ?? "<unknown>"}`);

            bridges.push({
                insideId: inside.portId, insideName: inside.portName,
                outsideId: outside.portId, outsideName: outside.portName,
                type
            });
        }

        return { bridges };
    }

    static createFactory(
        typeId: Identifier,
        createNew: () => GroupIONode,
        outToIn: boolean
    ): NodeFactory<GroupIONode, GroupIONodeData> {
        return {
            typeId: typeId,
            hidden: true, // We don't want user to create these special nodes
            label: "",
            createNew(project, nodeId) {
                return createNew();
            },
            createExisting(project, nodeId, data) {
                const node = createNew();
                node.outToIn = outToIn;
                node.bridges = data.bridges;
                return node;
            }
        };
    }

    // Post node creation
    // Man I hate doing this
    outToIn?: boolean;
    bridges?: BridgedPortData[];

    postNodeCreation(audio: BaseAudioContext) {
        this.bridges.forEach(bridge => {
            let bridgedPorts: { inside: IPort<any>; outside: IPort<any>; };

            switch (bridge.type) {
                case "midi":
                    bridgedPorts = new MidiPort(null, null).makeBridge(this.outToIn, this, bridge.insideId, this.group, bridge.outsideId);
                    break;
                case "signal":
                    bridgedPorts = new SignalPort(null, null, audio, null).makeBridge(this.outToIn, this, bridge.insideId, this.group, bridge.outsideId);
                    break;
                default:
                    console.warn(`[GroupNode] I don't understand ${bridge.type} type`);
                    return;
            }

            if (this.outToIn) bridgedPorts.outside.onConnectedToPort(bridgedPorts.inside);
            else bridgedPorts.inside.onConnectedToPort(bridgedPorts.outside);
            this.insideNetwork.push(bridgedPorts.inside);
            this.outsideNetwork.push(bridgedPorts.outside);

            bridgedPorts.inside.portName = bridge.insideName;
            bridgedPorts.outside.portName = bridge.outsideName;
        });
    }
}

export class GroupInputsNode extends GroupIONode {
    static readonly ID = "mixery:group_inputs_node";

    constructor() {
        super(GroupInputsNode.ID, "inputs", "Inputs", -100, 0, 100);
    }

    getOutputPorts(): IPort<any>[] {
        return [...this.insideNetwork, this.placeholder];
    }
}

export class GroupOutputsNode extends GroupIONode {
    static readonly ID = "mixery:group_outputs_node";

    constructor() {
        super(GroupOutputsNode.ID, "outputs", "Outputs", 100, 0, 100);
    }

    getInputPorts(): IPort<any>[] {
        return [...this.insideNetwork, this.placeholder];
    }
}

GlobalRegistries.NODE_FACTORIES.register(
    GroupInputsNode.ID,
    GroupIONode.createFactory(GroupInputsNode.ID, () => new GroupInputsNode(), true)
);
GlobalRegistries.NODE_FACTORIES.register(
    GroupOutputsNode.ID,
    GroupIONode.createFactory(GroupOutputsNode.ID, () => new GroupOutputsNode(), false)
);