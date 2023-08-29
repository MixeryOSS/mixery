import { IFileResource, IResource, IResourcesStore, Project } from "../index.js";
import { LoadingManager } from "../misc/LoadingManager.js";
import { Waveforms } from "../misc/Waveforms.js";
import { ResourceNamespace, ResourcePath } from "./ResourcePath.js";

type LoadedResourceID = `${ResourceNamespace}:${string}`;

function makeLoadedResourceID(path: ResourcePath): LoadedResourceID {
    return `${path.namespace}:${path.path.join("/")}`;
}

export class ResourcesManager {
    stores: Record<ResourceNamespace, IResourcesStore> = {
        user: undefined,
        project: undefined
    };
    loadedResources: Map<LoadedResourceID, LoadedResource> = new Map();

    constructor(
        public readonly project: Project,
        public readonly loadingManager: LoadingManager
    ) {
        this.stores.project = project.projectResources;
    }

    async loadResource(path: ResourcePath): Promise<LoadedResource> {
        const manager = this;
        const resourceId = makeLoadedResourceID(path);
        if (this.loadedResources.has(resourceId)) return this.loadedResources.get(resourceId);

        const store = this.stores[path.namespace];
        let resource = await store.getResource(path);
        let audioBuffer: AudioBuffer;
        let waveform: Waveforms.WaveformChannelData[];

        if (resource.isFile && (resource as IFileResource).blob.type.startsWith("audio/")) {
            audioBuffer = await (resource as IFileResource).getAudioBuffer();
            waveform = await Waveforms.sampleWaveform(audioBuffer);
        }

        const handle = {
            get path() { return path; },
            get manager() { return manager; },
            get resourceId() { return resourceId; },
            get resource() { return resource; },
            get audioBuffer() { return audioBuffer; },
            get waveform() { return waveform; },
        };

        this.loadedResources.set(resourceId, handle);
        return handle;
    }

    loadResourceWithLoader(path: ResourcePath): Promise<LoadedResource> {
        const task = this.loadResource(path)
        this.loadingManager.add(task);
        return task;
    }

    get(path: ResourcePath): LoadedResource | undefined {
        const resourceId = makeLoadedResourceID(path);
        if (this.loadedResources.has(resourceId)) return this.loadedResources.get(resourceId);
        return undefined;
    }
}

export interface LoadedResource {
    readonly path: ResourcePath;
    readonly manager: ResourcesManager;
    readonly resource: IResource;
    readonly resourceId: string;

    // Preloaded objects
    readonly audioBuffer?: AudioBuffer;
    readonly waveform?: Waveforms.WaveformChannelData[];
}