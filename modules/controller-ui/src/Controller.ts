import { LocalControllerConnection, type ControllerConnection, ControllerToMidi } from "@mixery/controller";
import { Emitter } from "./utils/Emitter";

export namespace Controller {
    const pair = LocalControllerConnection.createPair(0);

    /**
     * This is the client's connection. Modules must send messages through this connection.
     */
    export const client: ControllerConnection = pair.client;

    /**
     * Client loopback. You can send controller control messages to this loopback connection, like
     * note color change for example.
     */
    export const host: ControllerConnection = pair.host;

    export const onNoteColor = new Emitter<{ channel: number, midiIndex: number, color: string }>();

    let currentMidiInput: MIDIInput | undefined;
    let currentMidiOutput: MIDIOutput | undefined;
    export function getCurrentMidiInput() { return currentMidiInput; }
    export function getCurrentMidiOutput() { return currentMidiOutput; }

    export async function useMidiPort(port: MIDIPort) {
        if (port instanceof MIDIInput) await _useMidiPort(port, getCurrentMidiInput, v => currentMidiInput = v);
        if (port instanceof MIDIOutput) await _useMidiPort(port, getCurrentMidiOutput, v => currentMidiOutput = v);
    }

    async function _useMidiPort<T extends MIDIPort>(port: T, getter: () => T | undefined, setter: (port: T) => any) {
        const previousPort = getter();
        if (previousPort) await previousPort.close();
        ControllerToMidi.attachPortTo(port, port instanceof MIDIInput ? client : host);
        setter(port);
    }

    let midiAccess: MIDIAccess | undefined;
    export async function getMidiAccess() {
        if (!midiAccess) midiAccess = await navigator.requestMIDIAccess();
        return midiAccess;
    }
}