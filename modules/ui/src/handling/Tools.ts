import type { ITool, ToolContext, ToolObject } from "./ITool";

export namespace Tools {
    export const LIST: (() => ITool)[] = [
        () => new Pencil(),
        () => new Brush(),
        () => new Resizer(),
        () => new Eraser(),
    ];

    export class Pencil implements ITool {
        toolName: string = "Pencil";
        icon = "pen";
        currentObj?: ToolObject;
        eraseMode = false;
        moveMode = false;
        lastPosition = 0;

        onMouseDown(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            let hitObj = context.hitTest(position, trackPosition);

            if (buttons & 2) {
                this.eraseMode = true;
                if (hitObj) context.deleteObject(hitObj);
                return;
            }

            if (hitObj) {
                this.moveMode = true;
                context.selectObject(hitObj);
                this.currentObj = hitObj;
                this.lastPosition = position;
                return;
            }

            if (!this.currentObj) this.currentObj = context.createObject();
            this.currentObj.startPosition = position;
            this.currentObj.trackPosition = trackPosition;
            this.currentObj.duration = context.snapSegmentSize;
        }

        onMouseMove(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (this.eraseMode) {
                let obj = context.hitTest(position, trackPosition);
                if (obj) context.deleteObject(obj);
                return;
            }

            if (this.moveMode) {
                const delta = position - this.lastPosition;
                this.currentObj!.startPosition = Math.max(this.currentObj!.startPosition + delta, 0);
                this.currentObj!.trackPosition = trackPosition;
                this.lastPosition = position;
                return;
            }

            if (!this.currentObj) return;
            if (position > this.currentObj.startPosition) {
                this.currentObj.duration = Math.max(position - this.currentObj.startPosition, context.snapSegmentSize);
            } else {
                let endPosition = this.currentObj.startPosition + this.currentObj.duration;
                this.currentObj.duration = endPosition - position;
                this.currentObj.startPosition = position;
            }
        }

        onMouseUp(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            this.currentObj = undefined;
            this.eraseMode = false;
            this.moveMode = false;
        }
    }

    export class Eraser implements ITool {
        toolName: string = "Eraser";
        icon = "delete";
        isMouseDown = false;

        onMouseDown(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            let obj = context.hitTest(position, trackPosition);
            if (obj) context.deleteObject(obj);
            this.isMouseDown = true;
        }
        onMouseMove(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (!this.isMouseDown) return;
            let obj = context.hitTest(position, trackPosition);
            if (obj) context.deleteObject(obj);
        }
        onMouseUp(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            this.isMouseDown = false;
        }
    }

    export class Resizer implements ITool {
        toolName: string = "Resizer";
        icon = "resizer";
        currentObj?: ToolObject;
        lastPosition = 0;
        side: "left" | "right" | "both" | "move" | undefined;
        
        onMouseDown(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (this.currentObj) return;
            this.currentObj = context.hitTest(position, trackPosition);
            this.lastPosition = position;

            if (this.currentObj) {
                const startPosition = this.currentObj.startPosition;
                const endPosition = startPosition + this.currentObj.duration;
                const midPosition = (startPosition + endPosition) / 2;

                const startDist = Math.abs(position - startPosition);
                const midDist = Math.abs(position - midPosition);
                const endDist = Math.abs(position - endPosition);

                this.side = buttons == 2
                    ? "both" : startDist < midDist
                    ? "left" : midDist < endDist? "move"
                    : "right";
                context.selectObject(this.currentObj);
            }
        }

        onMouseMove(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (!this.currentObj) return;
            const delta = position - this.lastPosition;

            // TODO switch case
            if (this.side == "right") this.currentObj.duration += delta;
            else if (this.side == "left") {
                this.currentObj.startPosition = Math.max(this.currentObj.startPosition + delta, 0);
                this.currentObj.duration = Math.max(this.currentObj.duration - delta, context.snapSegmentSize);
            } else if (this.side == "both") {
                this.currentObj.startPosition = Math.max(this.currentObj.startPosition - delta, 0);
                this.currentObj.duration = Math.max(this.currentObj.duration + delta * 2, context.snapSegmentSize);
            } else if (this.side == "move") {
                this.currentObj.startPosition = Math.max(this.currentObj.startPosition + delta, 0);
                this.currentObj.trackPosition = trackPosition;
            }

            this.lastPosition = position;
        }

        onMouseUp(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            this.currentObj = undefined;
            this.lastPosition = 0;
            this.side = undefined;
        }
    }

    export class Brush implements ITool {
        toolName: string = "Brush";
        icon = "brush";
        lastLength = 0;
        lastPosition = 0;
        filling = false;

        onMouseDown(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            let obj = context.hitTest(position, trackPosition);
            if (obj && buttons != 2) {
                this.filling = false;
                this.lastLength = obj.duration;
                context.selectObject(obj);
            } else {
                this.filling = true;
                this.lastPosition = position;
                this.fill(context, buttons, position, trackPosition);
            }
        }

        onMouseMove(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (this.filling) this.fill(context, buttons, position, trackPosition);
        }

        onMouseUp(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            this.filling = false;
        }

        fill(context: ToolContext, buttons: number, position: number, trackPosition: any) {
            if (buttons == 2) {
                const hit = context.hitTest(position, trackPosition);
                if (hit) context.deleteObject(hit);
                return;
            }

            const length = Math.max(this.lastLength, context.snapSegmentSize);
            const start = Math.floor((position - this.lastPosition) / length) * length + this.lastPosition;
            if (start < 0) return;
            const end = start + length;
            if (context.hitTest(start, trackPosition) || context.hitTest(end - 0.1, trackPosition)) return;

            // TODO add context.cloneObject();
            let obj = context.createObject();
            obj.startPosition = start;
            obj.duration = end - start;
            obj.trackPosition = trackPosition;
        }
    }
}