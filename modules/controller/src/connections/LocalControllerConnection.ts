import { Message } from "../index.js";
import { ControllerConnection } from "./ControllerConnection.js";

class LocalControllerConnectionPeer implements ControllerConnection {
    #messageQueue: Message[] = [];
    #processingQueue = false;
    #listeners: ((message: Message) => any)[] = [];
    #isConnected = false;
    _peer: LocalControllerConnectionPeer;

    constructor(public readonly whenConnected: Promise<void>) {
        whenConnected.then(() => this.#isConnected = true);
    }

    get peer() { return this._peer; }
    get isConnected() { return this.#isConnected; }

    listenForMessages(listener: (message: Message) => any): void {
        this.#listeners.push(listener);
    }

    send(message: Message): void {
        if (!this.#isConnected) throw new Error("Not connected");
        this._peer._enqueue(message);
    }

    disconnect(): Promise<void> {
        this.#isConnected = false;
        return Promise.resolve();
    }

    _enqueue(message: Message) {
        this.#messageQueue.push(message);

        if (!this.#processingQueue) {
            this.#processingQueue = true;

            setTimeout(() => {
                while (this.#messageQueue.length > 0) {
                    const head = this.#messageQueue.shift();
                    this.#listeners.forEach(l => l(head));
                }

                this.#processingQueue = false;
            });
        }
    }
}

export namespace LocalControllerConnection {
    export function createPair(delay: number) {
        const timerTask = new Promise<void>(resolve => setTimeout(resolve, delay));
        const host = new LocalControllerConnectionPeer(timerTask);
        const client = new LocalControllerConnectionPeer(timerTask);
        client._peer = host;
        host._peer = client;
        return { host, client };
    }
}