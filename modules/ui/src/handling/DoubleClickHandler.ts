export class DoubleClickHandler {
    lastTimestamp = -1;

    constructor(
        public readonly speedGetter: () => number,
        public readonly callback: (event: PointerEvent) => any
    ) {}

    mouseDown(event: PointerEvent) {
        if (this.lastTimestamp == -1) {
            this.lastTimestamp = event.timeStamp;
            return;
        }

        const delta = event.timeStamp - this.lastTimestamp;
        if (delta > this.speedGetter()) {
            this.lastTimestamp = event.timeStamp;
            return;
        }

        this.lastTimestamp = -1;
        this.callback(event);
    }

    clear() {
        this.lastTimestamp = -1;
    }
}