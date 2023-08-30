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
    /**
     * Construct a brand new object.
     * 
     * For piano roll, this will always creates a new note. For patterns editor, this will always
     * creates a new notes clip.
     */
    createObject(): ToolObject;

    /**
     * Delete the object from editor.
     * @param obj Object to delete.
     */
    deleteObject(obj: ToolObject): void;

    /**
     * Perform "hit test" to get the object that occupies at given position.
     * @param position Time position to test.
     * @param trackPosition Track position to test.
     */
    hitTest(position: number, trackPosition: any): ToolObject | undefined;

    /**
     * Add object to the selection.
     * @param obj Object to select.
     */
    addSelection(obj: ToolObject): void;

    /**
     * Clear the selection from the editor.
     */
    clearSelection(): void;

    /**
     * Get all selected objects.
     */
    getSelection(): ToolObject[];

    /**
     * The object snap size.
     */
    readonly snapSegmentSize: number;
}

export interface ToolObject {
    /**
     * The underlying object. It is named `unwrap` because, well, it _unwraps_ the underlying
     * object when you access this property.
     */
    unwrap: any;

    /**
     * The start position of this object.
     */
    startPosition: number;

    /**
     * The duration of this object.
     */
    duration: number;

    /**
     * The track position of this object.
     */
    trackPosition: any;

    /**
     * Create a copy of this object (or replicate this object). This is the only way to create
     * a new audio clip in patterns editor.
     * 
     * The copy of this object will have the same start position, track and duration, but underlying
     * object can be different.
     */
    createCopy(): ToolObject;
}