import type { Identifier } from "@mixery/engine";

/**
 * Handle keyboard events + shortcuts thing idk man please help me write better docs.
 */
export class KeyboardHandler {
    /**
     * A set of pressed keybinds. Used for debouncing.
     */
    pressed = new Set<string>();

    keybinds: KeybindsContainer[] = [];

    async keydown(event: KeyboardEvent) {
        const kb = KeyboardHandler.eventToKeybind(event);
        if (this.pressed.has(kb)) return;
        this.pressed.add(kb);

        outer: for (let i = 0; i < this.keybinds.length; i++) {
            const container = this.keybinds[i];
            for (let j = 0; j < container.keybinds.length; j++) {
                const keybind = container.keybinds[j];
                const currentKb = keybind.currentKeybind ?? keybind.defaultKeybind;
                if (currentKb == kb && keybind.keydown && await keybind.keydown(event)) break outer;
            }
        }
    }

    async keyup(event: KeyboardEvent) {
        const kb = KeyboardHandler.eventToKeybind(event);
        this.pressed.delete(kb);

        outer: for (let i = 0; i < this.keybinds.length; i++) {
            const container = this.keybinds[i];
            for (let j = 0; j < container.keybinds.length; j++) {
                const keybind = container.keybinds[j];
                const currentKb = keybind.currentKeybind ?? keybind.defaultKeybind;
                if (currentKb == kb && keybind.keyup && await keybind.keyup(event)) break outer;
            }
        }
    }

    newContainer() {
        let container: KeybindsContainer = { keybinds: [] };
        this.keybinds.push(container);
        return container;
    }

    getAllKeybinds() {
        return this.keybinds.flatMap(v => v.keybinds).filter(v => !v.hiddenFromView);
    }

    /**
     * Convert event to keybind string.
     * @param event Event to convert.
     * @returns Keybind, with the following key modifiers order: `Ctrl`, `Alt` and then `Shift`
     */
    static eventToKeybind(event: KeyboardEvent) {
        if (event.code == "ShiftLeft") return "LShift";
        if (event.code == "ShiftRight") return "RShift";
        if (event.code == "CtrlLeft") return "LCtrl";
        if (event.code == "CtrlRight") return "RCtrl";
        if (event.code == "AltLeft") return "LAlt";
        if (event.code == "AltRight") return "RAlt";
        return `${event.ctrlKey? "Ctrl + " : ""}${event.metaKey? "Alt + " : ""}${event.shiftKey? "Shift + " : ""}${event.code}`;
    }
}

export interface Keybind {
    id: Identifier;
    name?: string;
    defaultKeybind: string;
    currentKeybind?: string;
    hiddenFromView?: boolean;
    keydown?(event: KeyboardEvent): boolean | Promise<boolean>;
    keyup?(event: KeyboardEvent): boolean | Promise<boolean>;
}

export interface KeybindsContainer {
    keybinds: Keybind[];
}