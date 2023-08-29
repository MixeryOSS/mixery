import { IFileResource, IFolderResource } from "../IResource.js";
import { ResourceNamespace, ResourcePath } from "../ResourcePath.js";
import { IResourcesStore } from "./IResourcesStore.js";
import { ResourcesStoreHelper } from "./ResourcesStoreHelper.js";

interface MemoryFileResource extends IFileResource {
    blob: Blob;
}

interface MemoryFolderResource extends IFolderResource {
    readonly _childrenResources: Map<string, MemoryResource>;
}

type MemoryResource = MemoryFileResource | MemoryFolderResource;

export class MemoryResourcesStore implements IResourcesStore {
    #root: MemoryFolderResource;
    
    constructor(
        public readonly namespace: ResourceNamespace,
        public readonly helper: ResourcesStoreHelper
    ) {
        const self = this;
        this.#root = {
            store: this,
            path: {namespace, path: []},
            isFolder: true, isFile: false,
            _childrenResources: new Map(),
            get children() { return [...self.#root._childrenResources.keys()]; }
        };
    }

    async getResource(path: ResourcePath): Promise<MemoryResource> {
        let currentRes: MemoryResource = this.#root;

        for (let i = 0; i < path.path.length; i++) {
            const name = path.path[i];
            if (currentRes.isFile) throw new Error(`${currentRes.path.path.join("/")} is not a folder`);
            currentRes = (currentRes as MemoryFolderResource)._childrenResources.get(name) as MemoryResource;
        }

        return currentRes;
    }

    #mkdir(parent: MemoryFolderResource, path: ResourcePath): MemoryFolderResource {
        const newFolderMap = new Map<string, MemoryResource>();
        const newFolder: MemoryFolderResource = {
            isFile: false,
            isFolder: true,
            _childrenResources: newFolderMap,
            get children() { return [...newFolderMap.keys()]; },
            path: structuredClone(path),
            store: this
        };
        parent._childrenResources.set(path.path[path.path.length - 1], newFolder);
        return newFolder;
    }

    async putFolder(path: ResourcePath): Promise<MemoryFolderResource> {
        let currentFolder = this.#root;

        for (let i = 0; i < path.path.length; i++) {
            let child = currentFolder._childrenResources.get(path.path[i]);
            if (!child) child = this.#mkdir(currentFolder, {
                namespace: path.namespace,
                path: [...path.path].splice(0, i + 1)
            });
            if (child.isFolder) currentFolder = child as MemoryFolderResource;
            else throw new Error(`Unable to make folder: ${path.path.join("/")}`);
        }

        return currentFolder;
    }

    async putResource(path: ResourcePath, blob: Blob): Promise<MemoryFileResource> {
        const folder = await this.putFolder({
            namespace: path.namespace,
            path: [...path.path].splice(0, path.path.length - 1)
        });

        const self = this;
        let cachedAudioBuffer: AudioBuffer | undefined;
        const res: MemoryFileResource = {
            isFile: true,
            isFolder: false,
            path: structuredClone(path),
            store: this,
            get blob() { return blob; },
            async getAudioBuffer() {
                if (!cachedAudioBuffer) cachedAudioBuffer = await self.helper.decodeAudioData(blob);
                return cachedAudioBuffer;
            },
        };
        folder._childrenResources.set(path.path[path.path.length - 1], res);
        return res;
    }
}