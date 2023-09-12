import { ControllerConnection, Identifier, Message, NoteEventMessage, NoteEventType } from "../index.js";

export namespace ControllerToMidi {
    export async function attachPortTo(port: MIDIPort, connection: ControllerConnection) {
        if (port.connection != "open") await port.open();

        if (port instanceof MIDIInput) {
            port.addEventListener("midimessage", (event: MessageEvent<Uint8Array>) => {
                const message = midiToMixeryController(event.data);
                if (!message) {
                    console.warn(`[MixeryC2MIDI] Failed to parse MIDI message`, event.data);
                    return;
                }

                connection.send(message);
            });
        }

        if (port instanceof MIDIOutput) {
            connection.listenForMessages(message => {
                const midi = mixeryControllerToMidi(message);
                if (!midi) {
                    console.warn(`[MixeryC2MIDI] Failed to convert Mixery Controller message to MIDI`, message);
                    return;
                }

                port.send(midi); // TODO send timestamp as well
            });
        }
    }

    export function midiToMixeryController(midi: Uint8Array) {
        const iter = midi2msg.values();
        let result: ReturnType<typeof iter.next>;

        while (!(result = iter.next()).done) {
            const msg = (result.value as MidiToMessageConverter)(midi);
            if (msg) return msg;
        }

        return undefined;
    }

    export function mixeryControllerToMidi(message: Message) {
        const converter = msg2midi.get(message.constructor as MessageClass);
        if (!converter) return undefined;
        return converter(message);
    }

    type MessageClass = { new(...args: any[]): Message };
    type MidiToMessageConverter = (data: Uint8Array) => Message | undefined;

    const midi2msg = new Set<MidiToMessageConverter>();
    const msg2midi = new Map<MessageClass, (message: Message) => Uint8Array>();

    midi2msg.add(data => {
        const status = data[0] & 0b1111_0000;
        let eventType: NoteEventType;
        switch (status) {
            case 0b1001_0000: eventType = NoteEventType.KEYDOWN; break;
            case 0b1000_0000: eventType = NoteEventType.KEYUP; break;
            default: return undefined;
        }

        const channel = data[0] & 0b0000_1111;
        const midiIndex = data[1];
        const velocity = data[2] / 127;
        return new NoteEventMessage(eventType, channel, midiIndex, velocity);
    });
    msg2midi.set(NoteEventMessage, (message: NoteEventMessage) => {
        const head = (message.eventType == NoteEventType.KEYDOWN? 0b1001_0000 : 0b1000_0000) | (message.channel & 0b1111);
        return new Uint8Array([head, message.midiIndex & 0x7F, Math.round(message.velocity * 127) & 0x7F]);
    });
}