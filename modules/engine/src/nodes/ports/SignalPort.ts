import { Identifier } from "../../types.js";
import { INode } from "../INode.js";
import { IPort } from "./IPort.js";

export class SignalPort implements IPort<SignalPort> {
    type: Identifier = "mixery:signal";
    portName?: string;
    connectedTo: Set<SignalPort> = new Set();

    constructor(
        public readonly node: INode<any, any>,
        public readonly portId: string,
        public readonly socket: AudioParam | AudioNode
    ) {}

    onConnectedToPort(port: SignalPort): void {
        if (this.socket instanceof AudioNode) this.socket.connect(port.socket as any);
    }

    onDisconnectedFromPort(port: SignalPort): void {
        if (this.socket instanceof AudioNode) this.socket.disconnect(port.socket as any);
    }
}