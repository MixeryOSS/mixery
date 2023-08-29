import { IFileResource, IFolderResource, IResource } from "../IResource.js";
import { ResourceNamespace, ResourcePath } from "../ResourcePath.js";

/**
 * The resources store interface that allows you to retrive and store resources.
 */
export interface IResourcesStore {
    /**
     * Namespace for this resources store.
     */
    readonly namespace: ResourceNamespace;

    /**
     * Fetch resource from resources store.
     * @param path The path to resource.
     */
    getResource(path: ResourcePath): Promise<IResource>;

    /**
     * Create a new folder (if not existed yet) in this resources store.
     * @param path The path to folder.
     */
    putFolder(path: ResourcePath): Promise<IFolderResource>;

    /**
     * Put/upload resource to resources store.
     * @param path Path to resource.
     * @param blob Resource data to put.
     */
    putResource(path: ResourcePath, blob: Blob): Promise<IFileResource>;
}