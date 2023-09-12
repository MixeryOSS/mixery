import { NodesNetworkContext, Project, Workspace } from "../index.js";
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
     * Used by special nodes. Prevent user from deleting the node.
     */
    readonly canNotBeDeleted?: boolean;

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
     * Save node into an object. The object must be able to serialized by Mixery Blobson, which
     * means you can't use custom class like `MyNodeDataClass`, but you can use `Blob`,
     * `ArrayBuffer` and `TypedArray` (like `Uint8Array` for example).
     */
    saveNode(): TData;

    /**
     * Create a copy of this node. This method must NOT attempt to halt main thread because this
     * will be used for synths, and each note must be played in real time.
     */
    createCopy(context: NodesNetworkContext): T;

    /**
     * Calculate release time. Used for synths to know when to disconnect cloned nodes from network.
     */
    calculateReleaseTime?(): number;
}

export type INodeAny = INode<any, any>;

export type NewNodeFactory<T extends INode<T, TData>, TData> = (
    project: Project,
    context: NodesNetworkContext,
    nodeId: string
) => T | Promise<T>;

export type NodeFromDataFactory<T extends INode<T, TData>, TData> = (
    project: Project,
    context: NodesNetworkContext,
    nodeId: string,
    data: TData
) => T | Promise<T>;

/**
 * Node factory. Used for constructing a brand new node or load node from data.
 */
export interface NodeFactory<T extends INode<T, TData>, TData> {
    readonly typeId: Identifier;
    readonly label: string;
    readonly category?: string;
    readonly hidden?: boolean;
    createNew: NewNodeFactory<T, TData>;
    createExisting: NodeFromDataFactory<T, TData>;
}

export interface NodeControl<T extends (string | number)> {
    label: string;
    value: T;
    minValue?: number;
    maxValue?: number;
}

export namespace NodeControls {
    export function makeParamControl(label: string, param: AudioParam, min?: number, max?: number): NodeControl<number> {
        return {
            label,
            get value() { return param.value; },
            set value(v) { param.value = v; },
            minValue: min ?? param.minValue,
            maxValue: max ?? param.maxValue
        };
    }
}