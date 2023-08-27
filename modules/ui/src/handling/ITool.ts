/**
 * Universal editor tools thing.
 */
export interface ITool {
    readonly toolName: string;
    readonly icon?: string;
    onMouseDown(context: ToolContext, buttons: number, position: number, trackPosition: any): any;
    onMouseMove(context: ToolContext, buttons: number, position: number, trackPosition: any): any;
    onMouseUp(context: ToolContext, buttons: number, position: number, trackPosition: any): any;
}

export interface ToolContext {
    createObject(): ToolObject;
    deleteObject(obj: ToolObject): void;
    hitTest(position: number, trackPosition: any): ToolObject | undefined;
    selectObject(obj: ToolObject): void;
    readonly snapSegmentSize: number;
}

export interface ToolObject {
    unwrap: any;
    startPosition: number;
    duration: number;
    trackPosition: any;
}