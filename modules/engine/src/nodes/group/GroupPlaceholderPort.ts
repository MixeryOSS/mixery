import { Identifier } from "../../types.js";
import { IPort } from "../ports/IPort.js";
import { GroupIONode, GroupInputsNode } from "./GroupIONode.js";

export class GroupPlaceholderPort implements IPort<any> {
    type: Identifier = "mixery:group_placeholder_port";
    readonly portId: string = "placeholder";
    readonly portName: string = "Add";
    readonly connectedTo: Set<IPort<any>> = new Set();

    constructor(public readonly node: GroupIONode) {
    }

    #makeBridge(target: IPort<any>) {
        if (!target.makeBridge) {
            throw new Error(`${target.constructor?.name ?? "<unknown>"} does not allow bridging`);
        }

        // Making ports
        const outToIn = this.node instanceof GroupInputsNode;
        const outsideId = this.node.group.children.generateNodeId();
        const insideId = this.node.group.children.generateNodeId();
        const bridge = target.makeBridge(outToIn, this.node, insideId, this.node.group, outsideId);
        const { outside, inside } = bridge;

        // Bridging
        if (this.node instanceof GroupInputsNode) outside.onConnectedToPort(inside);
        else inside.onConnectedToPort(outside);

        inside.portName = outside.portName = target.portName;
        return { outside, inside };
    }

    onConnectedToPort(port: IPort<any>) {
        // Handled in different method
        return false;
    }

    onDisconnectedFromPort(port: any) {
        // It is impossible to disconnect from placeholder port
        return false;
    }

    handlePlaceholderConnectTo(port: IPort<any>) {
        const bridge = this.#makeBridge(port);
        this.node.outsideNetwork.push(bridge.outside);
        this.node.insideNetwork.push(bridge.inside);
        if (this.node instanceof GroupInputsNode) this.node.group.children.connect(bridge.inside, port);
        else this.node.group.children.connect(port, bridge.inside);
    }

    handlePlaceholderConnectFrom(port: IPort<any>) {
        const bridge = this.#makeBridge(port);
        this.node.outsideNetwork.push(bridge.outside);
        this.node.insideNetwork.push(bridge.inside);
        if (this.node instanceof GroupInputsNode) this.node.group.children.connect(bridge.inside, port);
        else this.node.group.children.connect(port, bridge.inside);
    }
}