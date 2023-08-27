export interface IEmitter<T> {
    listen(cb: (obj: T) => any): void;
    emit(obj: T): void;
}

export class SimpleEmitter<T> implements IEmitter<T> {
    #callbacks: ((obj: T) => any)[] = [];
    #emitQueue: T[] = [];

    listen(cb: (obj: T) => any): void {
        this.#callbacks.push(cb);
    }

    emit(obj: T): void {
        const shouldEmit = this.#emitQueue.length == 0;
        this.#emitQueue.push(obj);
        if (!shouldEmit) return;

        do {
            let last = this.#emitQueue.pop();
            this.#callbacks.forEach(cb => cb(last));
        } while (this.#emitQueue.length > 0);
    }
}