export class CanvasRenderer {
    canvas: HTMLCanvasElement | OffscreenCanvas | undefined;
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | undefined;
    scaleFactor = 1;
    mouseX = -1;
    mouseY = -1;
    inputTranslation = [0, 0];

    constructor(public readonly callback: (renderer: CanvasRenderer) => any) {
    }

    startRender(canvas: HTMLCanvasElement | OffscreenCanvas) {
        if (!this.canvas || this.canvas != canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx == null) throw new Error("Unable to initialize 2D context");
            this.ctx = ctx;
            this.canvas = canvas;
        }

        if (this.canvas instanceof HTMLCanvasElement) {
            // We resize the canvas based on device pixel ratio to make it look HD
            // Should look really good on high DPI display!
            const renderWidth = Math.round(this.canvas.offsetWidth * devicePixelRatio * this.scaleFactor);
            const renderHeight = Math.round(this.canvas.offsetHeight * devicePixelRatio * this.scaleFactor);

            if (this.canvas.width != renderWidth || this.canvas.height != renderHeight) {
                this.canvas.width = renderWidth;
                this.canvas.height = renderHeight;
            }
        }

        this.ctx!.resetTransform();
        this.ctx!.scale(devicePixelRatio * this.scaleFactor, devicePixelRatio * this.scaleFactor);
        this.ctx!.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.inputTranslation[0] = 0;
        this.inputTranslation[1] = 0;
        return this;
    }

    begin() {
        this.ctx!.beginPath();
        return this;
    }

    pointer(x: number, y: number) {
        this.ctx!.moveTo(x, y);
        return this;
    }

    line(x: number, y: number) {
        this.ctx!.lineTo(x, y);
        return this;
    }

    end() {
        this.ctx!.closePath();
        return this;
    }

    stroke(c: string, width?: number) {
        this.ctx!.strokeStyle = c;
        if (width != undefined) this.ctx!.lineWidth = width;
        this.ctx!.stroke();
        return this;
    }

    fill(c: string) {
        this.ctx!.fillStyle = c;
        this.ctx!.fill();
        return this;
    }

    rect(x: number, y: number, width: number, height: number) {
        this.ctx!.rect(x, y, width, height);
        return this;
    }

    fillRect(x: number, y: number, width: number, height: number, c?: string) {
        if (c) this.ctx!.fillStyle = c;
        this.ctx!.fillRect(x, y, width, height);
        return this;
    }

    fillRoundRect(x: number, y: number, width: number, height: number, radix: number, c: string) {
        this.begin().roundRect(x, y, width, height, radix).fill(c).end();
        return this;
    }

    roundRect(x: number, y: number, width: number, height: number, radix: number) {
        this.ctx!.roundRect(x, y, width, height, radix);
        return this;
    }

    fillText(text: string, x: number, y: number, font?: string, c?: string) {
        if (font != undefined) this.ctx!.font = font;
        if (c != undefined) this.ctx!.fillStyle = c;
        this.ctx!.fillText(text, x, y);
        return this;
    }

    testMouseRect(x: number, y: number, width: number, height: number) {
        return this.mouseX != -1 && this.mouseY != -1 &&
            this.mouseX >= x && this.mouseX < (x + width) &&
            this.mouseY >= y && this.mouseY < (y + height);
    }

    progressBar(x: number, y: number, width: number, height: number, progress: number, progressed: string, pending: string) {
        return this
        .fillRect(x, y, width * progress, height, progressed)
        .fillRect(x + (width * progress), y, width * (1 - progress), height, pending);
    }

    fillTextWithLimit(text: string, x: number, y: number, maxWidth: number, font?: string, c?: string) {
        if (font != undefined) this.ctx!.font = font;
        if (c != undefined) this.ctx!.fillStyle = c;
        this.ctx!.fillText(text, x, y, maxWidth);
        return this;
    }
}