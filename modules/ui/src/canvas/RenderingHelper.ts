export namespace RenderingHelper {
    export namespace Keys {
        export const All = Symbol("All");
        export const SeekPointer = Symbol("SeekPointer");
        export const PatternsEditor = Symbol("PatternsEditor");
        export const PianoRoll = Symbol("PianoRoll");
        export const NodesEditor = Symbol("NodesEditor");
    }

    export type RenderCallback = () => any;

    export class RenderingManager {
        readonly registered = new Map<symbol, Set<RenderCallback>>();
        readonly scheduledKeys = new Set<symbol>();
        scheduledForUpdate = false;

        registerCallback(keys: symbol[], callback: RenderCallback) {
            keys.forEach(key => {
                let callbacks = this.registered.get(key);
                if (!callbacks) this.registered.set(key, callbacks = new Set());
                callbacks.add(callback);
            });
        }

        redrawRequest(...keys: symbol[]) {
            keys.forEach(key => this.scheduledKeys.add(key));

            if (!this.scheduledForUpdate) {
                this.scheduledForUpdate = true;
                window.requestAnimationFrame(() => this.forceRedraw());
            }
        }

        forceRedraw() {
            this.scheduledKeys.forEach(key => {
                const callbacks = this.registered.get(key);
                if (!callbacks) return;
                callbacks.forEach(cb => cb());
            });

            this.scheduledKeys.clear();
            this.scheduledForUpdate = false;
        }
    }
}