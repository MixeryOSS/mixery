import { IFileResource, IResource, IResourcesStore, Project } from "../index.js";
import { LoadingManager } from "../misc/LoadingManager.js";
import { ResourceNamespace, ResourcePath } from "./ResourcePath.js";

type CacheID = `${ResourceNamespace}:${string}`;

function makeCacheId(path: ResourcePath): CacheID {
    return `${path.namespace}:${path.path.join("/")}`;
}

export class ResourcesManager {
    stores: Record<ResourceNamespace, IResourcesStore> = {
        user: undefined,
        project: undefined
    };
    cache: Map<CacheID, ResourceHandle> = new Map();

    constructor(
        public readonly project: Project,
        public readonly loadingManager: LoadingManager
    ) {
        this.stores.project = project.projectResources;
    }

    makeHandle(path: ResourcePath): ResourceHandle {
        const manager = this;
        const cacheId = makeCacheId(path);
        if (this.cache.has(cacheId)) return this.cache.get(cacheId);

        const store = this.stores[path.namespace];
        let cachedResource: IResource;
        let cachedAudioBuffer: AudioBuffer;

        return {
            get path() { return path; },
            get manager() { return manager; },
            get cacheId() { return cacheId; },
            get cachedResource() {
                if (!cachedResource) {
                    const task = store
                        .getResource(path)
                        .then(resource => cachedResource = resource);
                    manager.loadingManager.add(task);
                }

                return cachedResource;
            },
            get cachedAudioBuffer() {
                if (!cachedAudioBuffer) {
                    const task = store
                        .getResource(path)
                        .then(async resource => {
                            if (resource.isFile) {
                                return await (resource as IFileResource).getAudioBuffer();
                            } else {
                                return null;
                            }
                        })
                        .then(audioBuffer => cachedAudioBuffer = audioBuffer);
                    manager.loadingManager.add(task);
                }

                return cachedAudioBuffer;
            },
        };
    }
}

export interface ResourceHandle {
    readonly path: ResourcePath;
    readonly manager: ResourcesManager;

    // Caching
    readonly cacheId: CacheID;
    readonly cachedResource: IResource;
    readonly cachedAudioBuffer: AudioBuffer;
}