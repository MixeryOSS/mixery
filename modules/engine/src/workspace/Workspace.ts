import { GlobalRegistries, IReadonlyRegistry, TransitiveRegistry } from "../misc/Registries.js";
import { NodeFactory } from "../nodes/INode.js";

/**
 * Mixery workspace.
 * 
 * Workspaces can be used for offline audio rendering. Simply pass `OfflineAudioContext` to
 * constructor, play the project then start the audio rendering to render.
 */
export class Workspace {
    /**
     * A bunch of registries that are bounds to this workspace.
     */
    registries: WorkspaceRegistries = {
        nodeFactories: new TransitiveRegistry(GlobalRegistries.NODE_FACTORIES)
    };

    constructor(public readonly audio: BaseAudioContext) {}
}

export interface WorkspaceRegistries {
    nodeFactories: IReadonlyRegistry<NodeFactory<any, any>>;
}