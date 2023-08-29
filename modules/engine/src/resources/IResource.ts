import { IResourcesStore } from "./store/IResourcesStore.js";
import { ResourcePath } from "./ResourcePath.js";

export interface IResourceBase {
    readonly store: IResourcesStore;
    readonly path: ResourcePath;
    readonly isFolder: boolean;
    readonly isFile: boolean;
}

export interface IFolderResource extends IResourceBase {
    readonly isFolder: true;
    readonly children: ReadonlyArray<string>;
}

export interface IFileResource extends IResourceBase {
    readonly isFile: true;
    readonly blob: Blob;
    getAudioBuffer(): Promise<AudioBuffer>;
}

export type IResource = IFolderResource | IFileResource;