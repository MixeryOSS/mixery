import { Identifier } from "../../types.js";
import { INodeAny } from "../INode.js";

/**
 * An interface for ports. Ports are part of the node, where an output port can connect to input
 * port of same type.
 */
export interface IPort<T extends IPort<T>> {
    /**
     * Port type. This is used to check if it is possible to connect 2 `IPort`s.
     */
    readonly type: Identifier;

    /**
     * ID of this port. Used for saving and loading. Note that you don't have to make port IDs
     * unique everytime a node is created. For example: `midiOut`, `audioIn`, `gain`.
     */
    readonly portId: string;

    /**
     * Name of this port. Used for displaying. Leave blank to use port ID.
     */
    portName?: string;

    // readonly connectedTo?: IPort<T>;
    readonly connectedTo: Set<IPort<T>>;
    readonly node: INodeAny;

    /**
     * Called when this port is connected to another port.
     * @param port Destination port that this port is connected to.
     * @returns `true` if a connection was created.
     */
    onConnectedToPort(port: T): boolean;

    /**
     * Called when this port is disconnected from another port.
     * @param port Port that this port is disconnected from.
     * @returns `true` if the connection is destroyed.
     */
    onDisconnectedFromPort(port: T): boolean;

    makeBridge?(
        outsideToInside: boolean,
        nodeInside: INodeAny, idInside: string,
        nodeOutside: INodeAny, idOutside: string
    ): { inside: T, outside: T };
}

/**
 * Location of the port as nodeid-portid pair.
 */
export type PortLocation = [string, string];