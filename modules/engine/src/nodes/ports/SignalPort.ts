import { Identifier } from "../../types.js";
import { INode, INodeAny } from "../INode.js";
import { IPort } from "./IPort.js";

export class SignalPort implements IPort<SignalPort> {
    type: Identifier = "mixery:signal";
    portName?: string;
    connectedTo: Set<SignalPort> = new Set();

    constructor(
        public readonly node: INode<any, any>,
        public readonly portId: string,
        public readonly audioContext: BaseAudioContext,
        public readonly socket: AudioParam | AudioNode
    ) {}

    onConnectedToPort(port: SignalPort) {
        if (this.socket instanceof AudioNode) this.socket.connect(port.socket as any);
        this.connectedTo.add(port);
        return true;
    }

    onDisconnectedFromPort(port: SignalPort) {
        if (this.socket instanceof AudioNode) this.socket.disconnect(port.socket as any);
        return this.connectedTo.delete(port);
    }

    makeBridge(outToIn: boolean, nodeInside: INodeAny, idInside: string, nodeOutside: INodeAny, idOutside: string): { inside: SignalPort; outside: SignalPort; } {
        const self = this;
        const bridge = {
            inside: new SignalPort(nodeInside, idInside, self.audioContext, self.audioContext.createGain()),
            outside: new SignalPort(nodeOutside, idOutside, self.audioContext, self.audioContext.createGain())
        };
        return bridge;
    }
}