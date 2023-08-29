import { IResourcesStore, MemoryResourcesStore } from "../index.js";
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

    save() {
        let saved: SavedProject = {
            metadata: structuredClone(this.metadata),
            bpm: this.bpm,
            nodes: this.nodes.save(),
            playlist: structuredClone(this.playlist),
        };

        return saved;
    }

    load(saved: SavedProject) {
        this.metadata = structuredClone(saved.metadata);
        this.bpm = saved.bpm;
        this.nodes = new NodesNetwork().load(saved.nodes, this.workspace);
        this.playlist = structuredClone(saved.playlist);
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
    // TODO resources;
}