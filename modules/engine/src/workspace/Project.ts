import { ReadableWebStream, WritableBlobStream } from "@mixery/blobson";
import { IResourcesStore, MemoryResourcesStore, ResourcesBundler } from "../index.js";
import { NodesNetwork, SavedNodesNetwork } from "../nodes/NodesNetwork.js";
import { Playlist } from "../playlist/Playlist.js";
import { ResourcesManager } from "../resources/ResourcesManager.js";
import { Workspace } from "./Workspace.js";

export class Project {
    metadata: ProjectMetadata = {};
    bpm: number = 120;
    nodes: NodesNetwork = new NodesNetwork();
    playlist: Playlist = {tracks: []};
    projectResources: IResourcesStore;
    resourcesManager: ResourcesManager;

    constructor(public readonly workspace: Workspace) {
        this.projectResources = new MemoryResourcesStore("project", {
            async decodeAudioData(blob) {
                return await workspace.audio.decodeAudioData(await blob.arrayBuffer());
            },
        });

        this.resourcesManager = new ResourcesManager(this, workspace.loadingManager);
    }

    async saveToObject() {
        let saved: SavedProject = {
            metadata: structuredClone(this.metadata),
            bpm: this.bpm,
            nodes: this.nodes.save(),
            playlist: structuredClone(this.playlist),
            resources: await ResourcesBundler.bundle(this.projectResources)
        };

        return saved;
    }

    async saveToBlob() {
        const stream = new WritableBlobStream();
        stream.writeString("Mixery Project v1");
        stream.writeObject(await this.saveToObject());
        return stream.toBlob({ type: "application/x.mixery.project" });
    }

    async loadFromObject(saved: SavedProject) {
        this.metadata = structuredClone(saved.metadata);
        this.bpm = saved.bpm;
        await ResourcesBundler.apply(this.projectResources, saved.resources);
        this.nodes = await new NodesNetwork().load(saved.nodes, this);
        this.playlist = structuredClone(saved.playlist);
    }

    async loadFromBlob(blob: Blob) {
        // TODO move this to "global Mixery file reader" thing
        const stream = new ReadableWebStream(blob.stream());
        const signature = await stream.readString();
        const savedData: SavedProject = await stream.readObject();
        await this.loadFromObject(savedData);
    }
}

export interface ProjectMetadata {
    name?: string;
    authors?: string;
    description?: string;
}

export interface SavedProject {
    metadata: ProjectMetadata;
    bpm: number;
    nodes: SavedNodesNetwork;
    playlist: Playlist;
    resources: ResourcesBundler.Resource[];
}