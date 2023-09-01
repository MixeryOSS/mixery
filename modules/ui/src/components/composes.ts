import { computed, ref, type Ref } from "vue";
import type { ContextMenuEntry } from "./contextmenus/ContextMenuEntry";

export interface UseTrackableXYOptions {
    scale?: number;
    shiftScale?: number;
    ctrlScale?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}

/**
 * Track mouse position changes when dragging and update to VueJS axes refs.
 * @param elem Element to bind mouse event.
 * @param x VueJS ref for X axis.
 * @param y VueJS ref for Y axis.
 * @param options Tracking options.
 */
export function useTrackableXY(elem: HTMLElement, x?: Ref<number>, y?: Ref<number>, options?: UseTrackableXYOptions) {
    const minX = options?.minX ?? Number.NEGATIVE_INFINITY;
    const maxX = options?.maxX ?? Number.POSITIVE_INFINITY;
    const minY = options?.minY ?? Number.NEGATIVE_INFINITY;
    const maxY = options?.maxY ?? Number.POSITIVE_INFINITY;

    if (elem instanceof HTMLElement) {
        elem.addEventListener("pointerdown", event => {
            let mouseMove: (event: PointerEvent) => any;
            let mouseUp: (event: PointerEvent) => any;

            document.addEventListener("pointermove", mouseMove = event => {
                let scale = event.shiftKey
                    ? (options?.shiftScale ?? 1.0)
                    : event.ctrlKey? (options?.ctrlScale ?? 1.0)
                    : (options?.scale ?? 1.0);
                if (x) x.value = Math.max(Math.min(x.value + event.movementX * scale, maxX), minX);
                if (y) y.value = Math.max(Math.min(y.value + event.movementY * scale, maxY), minY);
            });

            document.addEventListener("pointerup", mouseUp = event => {
                document.removeEventListener("pointermove", mouseMove);
                document.removeEventListener("pointerup", mouseUp);
            });
        });
    }
}

export function useTrackableXYv2(x?: Ref<number>, y?: Ref<number>, options?: UseTrackableXYOptions) {
    const minX = options?.minX ?? Number.NEGATIVE_INFINITY;
    const maxX = options?.maxX ?? Number.POSITIVE_INFINITY;
    const minY = options?.minY ?? Number.NEGATIVE_INFINITY;
    const maxY = options?.maxY ?? Number.POSITIVE_INFINITY;

    return function(event: PointerEvent) {
        let mouseMove: (event: PointerEvent) => any;
        let mouseUp: (event: PointerEvent) => any;

        document.addEventListener("pointermove", mouseMove = event => {
            let scale = event.shiftKey
                ? (options?.shiftScale ?? 1.0)
                : event.ctrlKey? (options?.ctrlScale ?? 1.0)
                : (options?.scale ?? 1.0);
            if (x) x.value = Math.max(Math.min(x.value + event.movementX * scale, maxX), minX);
            if (y) y.value = Math.max(Math.min(y.value + event.movementY * scale, maxY), minY);
        });

        document.addEventListener("pointerup", mouseUp = event => {
            document.removeEventListener("pointermove", mouseMove);
            document.removeEventListener("pointerup", mouseUp);
        });
    }
}

export function useResizeObserver(target: HTMLElement, callback: ResizeObserverCallback) {
    let observer = new ResizeObserver(callback);
    observer.observe(target);
    return observer;
}

export function useParentState<T>(
    key: string,
    props: { [x: string]: any },
    emits: (event: any, value: T) => any
) {
    return computed<T>({
        get() { return props[key]; },
        set(v) { emits("update:" + key, v); }
    });
}