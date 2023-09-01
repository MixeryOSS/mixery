import { RenderingHelper } from "@/canvas/RenderingHelper";
import { Project, Workspace, type Clip, Player, type INode, SpeakerNode, PluckNode, type NotesClip, AudioSourceNode, NotesSourceNode, NodesNetwork } from "@mixery/engine";
import { KeyboardHandler, type KeybindsContainer } from "./KeyboardHandler";

export namespace MixeryUI {
    /**
     * Create a new project with default setup.
     * @param ws Mixery workspace.
     * @returns Brand new project.
     */
    export function createNewProject(ws: Workspace): Project {
        const project = new Project(ws);

        // Playlist tracks
        for (let i = 0; i < 9; i++) project.playlist.tracks.push({ trackName: `Track ${i + 1}`, clips: [], isMuted: false, trackHeight: 40 });

        // Nodes network
        const audioInputNode = new AudioSourceNode(project.nodes.generateNodeId(), ws.audio);
        audioInputNode.data.channelName = "Default Channel";
        audioInputNode.nodeX = -50;
        audioInputNode.nodeY = -100;

        const midiInputNode = new NotesSourceNode(project.nodes.generateNodeId());
        midiInputNode.data.channelName = "Default Channel";
        midiInputNode.nodeX = -200;

        const pluckNode = new PluckNode(project.nodes.generateNodeId(), ws.audio);
        pluckNode.nodeX = -50;

        const speakerNode = new SpeakerNode(project.nodes.generateNodeId(), ws.audio);
        speakerNode.nodeX = 100;

        project.nodes.nodes.push(audioInputNode, midiInputNode, pluckNode, speakerNode);
        project.nodes.connect(midiInputNode.midiOut, pluckNode.midiIn);
        project.nodes.connect(pluckNode.audioOut, speakerNode.speakerPort);
        project.nodes.connect(audioInputNode.audioOut, speakerNode.speakerPort);

        // Project resources
        project.projectResources.putFolder({namespace: "project", path: ["Audio Samples"]});
        project.projectResources.putFolder({namespace: "project", path: ["Presets"]});
        return project;
    }

    export class WorkspaceView {
        readonly rendering = new RenderingHelper.RenderingManager();
        settings: WorkspaceSettings = {
            fancyRendering: true,
            accentColor: [177, 100, 71],
            doubleClickSpeed: 500, // Default Windows double-click speed
        };
        project: Project;
        player: Player;

        // Workspace
        keyboardHandler = new KeyboardHandler();
        workspaceKeybinds: KeybindsContainer;
        windowKeybinds: KeybindsContainer;

        // Editors
        selectedClips: Set<Clip> = new Set(); // Patterns editor
        selectedNode: INode<any, any> | undefined; // Nodes editor, TODO multiple nodes
        editingNotesClip: NotesClip | undefined; // Piano roll
        nodesStack: NodesNetwork[];
        
        constructor(
            public readonly workspace: Workspace,
            public readonly id: string
        ) {
            this.rendering = new RenderingHelper.RenderingManager();
            this.project = createNewProject(workspace);
            this.player = new Player(this.project);
            this.nodesStack = [this.project.nodes];

            this.workspaceKeybinds = this.keyboardHandler.newContainer();
            this.windowKeybinds = this.keyboardHandler.newContainer();
        }

        setProject(project: Project): void {
            this.player.stop();
            this.project = project;
            this.player = new Player(project);
            this.selectedClips.clear();
            this.selectedNode = undefined;
            this.editingNotesClip = undefined;
            this.nodesStack = [this.project.nodes];
            this.rendering.redrawRequest(RenderingHelper.Keys.All);
        }
    }

    export interface WorkspaceSettings {
        fancyRendering: boolean;
        accentColor: [number, number, number];
        doubleClickSpeed: number;
    }

    export const workspaces: Map<string, WorkspaceView> = new Map();

    let counter = 0;
    function generateId() {
        return `mixery-ws-${counter++}`;
    }

    export function createWorkspace(audioContext: AudioContext) {
        const ws = new Workspace(audioContext);
        const id = generateId();
        const view = new WorkspaceView(ws, id);
        workspaces.set(id, view);
        return view;
    }

    export const defaultWorkspace = createWorkspace(new AudioContext({
        latencyHint: "interactive"
    }));
}

// @ts-ignore
globalThis["MixeryUI"] = MixeryUI;