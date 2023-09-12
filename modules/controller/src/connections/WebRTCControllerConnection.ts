import { Message, Messages } from "../index.js";
import { ControllerConnection } from "./ControllerConnection.js";

export class WebRTCControllerConnection implements ControllerConnection {
    readonly whenConnected: Promise<void>;

    get isConnected(): boolean {
        return this.underlying.connectionState == "connected" && this.rtcChannel != undefined;
    }

    // Connection
    #listeners: ((message: Message) => any)[] = [];

    // WebRTC
    rtcChannel: RTCDataChannel;

    constructor(public readonly underlying: RTCPeerConnection) {
        this.whenConnected = new Promise(resolve => {
            underlying.addEventListener("datachannel", event => {
                console.log("[WebRTC] Data channel found! Switching to connected state...");
                this.rtcChannel = event.channel;
                this.rtcChannel.binaryType = "blob";

                this.rtcChannel.addEventListener("message", async event => {
                    if (typeof event.data == "string") {
                        console.warn("[WebRTC] Received string instead of Blob, skipping...");
                        return;
                    }

                    const blob: Blob = event.data instanceof ArrayBuffer? new Blob([event.data]) : event.data;
                    const message = await Messages.unpack(blob);
                    if (!message) {
                        console.warn("[WebRTC] Unable to parse message", blob);
                        return;
                    }

                    this.#listeners.forEach(l => l(message));
                });

                resolve();
            });
        });
    }

    listenForMessages(listener: (message: Message) => any): void {
        this.#listeners.push(listener);
    }

    send(message: Message): void {
        if (!this.isConnected) throw new Error("Not connected yet!");
        this.rtcChannel.send(Messages.pack(message));
    }

    disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}