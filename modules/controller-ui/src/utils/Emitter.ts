import { onMounted, onUnmounted } from "vue";

export class Emitter<T> {
    #listeners = new Set<EmitterListener<T>>();
    #queue: T[] = [];
    #emitting = false;
    
    emit(event: T) {
        this.#queue.push(event);
        if (this.#emitting) return;

        this.#emitting = true;
        while (this.#queue.length > 0) {
            const head = this.#queue.shift();
            this.#listeners.forEach(l => l(head!));
        }
        this.#emitting = false;
    }

    listen(listener: EmitterListener<T>) {
        this.#listeners.add(listener);
    }

    stopListening(listener: EmitterListener<T>) {
        this.#listeners.delete(listener);
    }

    /**
     * Create a "proxy" emitter that removes itself from this parent emitter when the component
     * is unmounted. For use in Vue components.
     */
    useProxy() {
        const proxy = new Emitter<T>();
        function parentListener(event: T) { proxy.emit(event); }
        onMounted(() => this.listen(parentListener));
        onUnmounted(() => this.stopListening(parentListener));
        return proxy;
    }
}

export type EmitterListener<T> = (event: T) => any;