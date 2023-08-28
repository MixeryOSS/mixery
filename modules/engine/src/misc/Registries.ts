import { NodeFactory } from "../nodes/INode.js";
import { Identifier } from "../types.js";

export interface IReadonlyRegistry<T> {
    get(id: Identifier): T | undefined;
    forEach(callback: (id: Identifier, value: T) => any): void;
}

export interface IRegistry<T> extends IReadonlyRegistry<T> {
    register(id: Identifier, entry: T): T;
}

export class SimpleRegistry<T> implements IRegistry<T> {
    #backedMap = new Map<Identifier, T>();

    register(id: Identifier, entry: T): T {
        if (this.#backedMap.has(id)) throw new Error(`${id} is already registered`);
        this.#backedMap.set(id, entry);
        return entry;
    }

    get(id: Identifier): T | undefined {
        return this.#backedMap.get(id);
    }

    forEach(callback: (id: Identifier, value: T) => any): void {
        const iter = this.#backedMap.keys();
        let id: IteratorResult<Identifier>;
        while (!(id = iter.next()).done) callback(id.value, this.#backedMap.get(id.value));
    }
}

export class TransitiveRegistry<T> implements IRegistry<T> {
    #backed = new SimpleRegistry<T>();

    constructor(readonly parent: IReadonlyRegistry<T>) {}

    register(id: Identifier, entry: T): T {
        this.#backed.register(id, entry);
        return entry;
    }
    
    get(id: Identifier): T | undefined {
        return this.parent.get(id) ?? this.#backed.get(id);
    }

    forEach(callback: (id: Identifier, value: T) => any): void {
        this.parent.forEach(callback);
        this.#backed.forEach(callback);
    }
}

export namespace GlobalRegistries {
    export const NODE_FACTORIES = new SimpleRegistry<NodeFactory<any, any>>();
}