import { NodesNetwork, SavedNodesNetwork } from "../nodes/NodesNetwork.js";
import { Playlist } from "../playlist/Playlist.js";
import { Workspace } from "./Workspace.js";

export class Project {
    metadata: ProjectMetadata = {};
    bpm: number = 120;
    nodes: NodesNetwork = new NodesNetwork();
    playlist: Playlist = {
        tracks: []
    };

    constructor(public readonly workspace: Workspace) {}

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
}