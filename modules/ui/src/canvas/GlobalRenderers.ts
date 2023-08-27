export namespace GlobalRenderers {
    export const CALLBACKS: (() => any)[] = [];
    let isRedrawQueued = false;

    export function sendRedrawRequest() {
        if (isRedrawQueued) return;

        isRedrawQueued = true;
        window.requestAnimationFrame(() => {
            isRedrawQueued = false;
            CALLBACKS.forEach(c => c());
        });
    }
}