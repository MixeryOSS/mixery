import type { ControllerConnection } from "@mixery/controller";
import { Emitter } from "./utils/Emitter";

export namespace Controller {
    export let connection: ControllerConnection | undefined;
    export const onNoteColor = new Emitter<{ channel: number, midiIndex: number, color: string }>();
}