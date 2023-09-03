import { UniqueID } from "@mixery/engine";
import type { Keybind } from "./KeyboardHandler";
import type { MixeryUI } from "./MixeryUI";

export namespace VirtualPianoKeyboard {
    export function key(workspace: MixeryUI.WorkspaceView, midi: number, def: string): Keybind {
        const uid = UniqueID.generate();

        return {
            id: `mixery:virtual_piano/midi_${midi}`,
            hiddenFromView: true,
            defaultKeybind: def,
            keydown(event) {
                workspace.project.nodes.sendNoteSignal("Default Channel", {
                    uid,
                    signalType: "instant",
                    eventType: "keydown",
                    midiIndex: midi,
                    velocity: 0.8
                });
                return true;
            },
            keyup(event) {
                workspace.project.nodes.sendNoteSignal("Default Channel", {
                    uid,
                    signalType: "instant",
                    eventType: "keyup",
                    midiIndex: midi,
                    velocity: 0.8
                });
                return true;
            },
        };
    }

    /**
     * Use the Mixery QWERTY to piano layout. C4 starts from `KeyA`. Hold Shift while pressing
     * to shift the octave up by 1.
     * 
     * The main reason why only the middle row was choosen is because it is the row with highest
     * NKRO (n-key rollover) on regular keyboards. On a decent mechanical keyboard, you might have
     * better NKRO on different rows, so you can use full layout instead of this one.
     * @param workspace The workspace.
     */
    export function useMixeryLayout(workspace: MixeryUI.WorkspaceView) {
        workspace.virtualPianoKeybinds.keybinds = [
            key(workspace, 60, "KeyA"), key(workspace, 61, "KeyW"),
            key(workspace, 62, "KeyS"), key(workspace, 63, "KeyE"),
            key(workspace, 64, "KeyD"),
            key(workspace, 65, "KeyF"), key(workspace, 66, "KeyT"),
            key(workspace, 67, "KeyG"), key(workspace, 68, "KeyY"),
            key(workspace, 69, "KeyH"), key(workspace, 70, "KeyU"),
            key(workspace, 71, "KeyJ"),
            key(workspace, 72, "KeyK"), key(workspace, 73, "KeyO"),
            key(workspace, 74, "KeyL"), key(workspace, 75, "KeyP"),
            key(workspace, 76, "Semicolon"),
            key(workspace, 77, "Quote"),
            
            key(workspace, 72, "Shift + KeyA"), key(workspace, 73, "Shift + KeyW"),
            key(workspace, 74, "Shift + KeyS"), key(workspace, 75, "Shift + KeyE"),
            key(workspace, 76, "Shift + KeyD"),
            key(workspace, 77, "Shift + KeyF"), key(workspace, 78, "Shift + KeyT"),
            key(workspace, 79, "Shift + KeyG"), key(workspace, 80, "Shift + KeyY"),
            key(workspace, 81, "Shift + KeyH"), key(workspace, 82, "Shift + KeyU"),
            key(workspace, 83, "Shift + KeyJ"),
            key(workspace, 84, "Shift + KeyK"), key(workspace, 85, "Shift + KeyO"),
            key(workspace, 86, "Shift + KeyL"), key(workspace, 87, "Shift + KeyP"),
            key(workspace, 88, "Shift + Semicolon"),
            key(workspace, 89, "Shift + Quote"),
        ];
    }
}