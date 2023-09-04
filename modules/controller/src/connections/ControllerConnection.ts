import { Message } from "../index.js";

export interface ControllerConnection {
    /**
     * A `Promise` that will be resolved when connected and rejected when an error occurred while
     * connecting.
     */
    readonly whenConnected: Promise<void>;
    readonly isConnected: boolean;

    /**
     * Listen for incoming messages.
     * @param listener The listener callback function.
     */
    listenForMessages(listener: (message: Message) => any): void;

    /**
     * Send message to peer.
     * @param message Message to send.
     */
    send(message: Message): void;

    /**
     * Request disconnect.
     */
    disconnect(): Promise<void>;
}