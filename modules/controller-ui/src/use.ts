import { computed, ref, type Ref } from "vue";

export function useParentRef<T>(
    name: string,
    props: Record<string, any>,
    emits: (event: any, value: any) => any): Ref<T>
{
    return computed({
        get() { return props[name]; },
        set(v) { emits(`update:${name}`, v); }
    });
}

export function useDraggable(refX?: Ref<number>, refY?: Ref<number>) {
    return {
        onPointerDown(event: PointerEvent) {
            const id = event.pointerId;

            function onPointerMove(event: PointerEvent) {
                if (event.pointerId != id) return;
                if (refX) refX.value += event.movementX;
                if (refY) refY.value += event.movementY;
            }
        
            function onPointerUp(event: PointerEvent) {
                if (event.pointerId != id) return;
                document.removeEventListener("pointermove", onPointerMove);
                document.removeEventListener("pointerup", onPointerUp);
            }

            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
        }
    };
}

export function useMapper<T>(ref: Ref<T>, mapper: (v: T) => T, reverseMapper: (v: T) => T) {
    return computed({
        get() { return mapper(ref.value); },
        set(v) { ref.value = reverseMapper(v); }
    });
}

export function useSmoothSnapEffect(ref: Ref<number>, smoothRatio = 0.5) {
    return computed(() => {
        const target = Math.round(ref.value);
        const delta = ref.value - target;
        return target + delta * smoothRatio;
    });
}