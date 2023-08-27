import { Workspace } from "../index.js";
import { IReadonlyRegistry } from "../misc/Registries.js";
import { Identifier } from "../types.js";
import { IPort } from "./ports/IPort.js";

export interface INode<T extends INode<T, TData>, TData> {
    /**
     * Type identifier of this node, in `namespace:name` syntax. Namespace can be the ID of your
     * Mixery add-on and name can be whatever you want. This is used to find node factory by reading
     * identifier from saved data, then use that factory to reconstruct a replication from that.
     */
    readonly typeId: Identifier;

    /**
     * ID of this node. Must be random. Used for handling the ports connection.
     */
    readonly nodeId: string;

    /**
     * Name of this node. Can be changed by user.
     */
    nodeName?: string;

    nodeX: number;
    nodeY: number;
    nodeWidth: number;

    getControls(): NodeControl<any>[];

    /**
     * Get all input ports of this node.
     */
    getInputPorts(): IPort<any>[];

    /**
     * Get all output ports of this node.
     */
    getOutputPorts(): IPort<any>[];

    /**
     * Save node into an object. The object must be able to serialized into JSON string and can
     * be deserialized from JSON.
     */
    saveNode(): TData;
}

export type NewNodeFactory<T extends INode<T, TData>, TData> = (
    workspace: Workspace,
    nodeId: string
) => T;

export type NodeFromDataFactory<T extends INode<T, TData>, TData> = (
    workspace: Workspace,
    nodeId: string,
    data: TData
) => T;

/**
 * Node factory. Used for constructing a brand new node or load node from data.
 */
export interface NodeFactory<T extends INode<T, TData>, TData> {
    readonly typeId: Identifier;
    createNew: NewNodeFactory<T, TData>;
    createExisting: NodeFromDataFactory<T, TData>;
}

export interface NodeControl<T extends (string | number)> {
    label: string;
    value: T;
}