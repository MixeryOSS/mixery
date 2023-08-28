import { Project, Workspace, type PlaylistTrack, type Clip, Player, type INode, NoteClipNode, SpeakerNode, PluckNode } from "@mixery/engine";

export namespace MixeryUI {
    export interface WorkspaceInterface {
        readonly workspace: Workspace;
        readonly id: string;
        settings: WorkspaceSettings;
        project: Project;
        selectedClip: Clip;
        selectedNode: INode<any, any> | undefined;
        player: Player;

        setProject(project: Project): void;
    }

    export interface WorkspaceSettings {
        fancyRendering: boolean;
        accentColor: [number, number, number];
    }

    export const workspaces: Map<string, WorkspaceInterface> = new Map();

    let counter = 0;
    function generateId() {
        return `mixery-ws-${counter++}`;
    }

    export function createWorkspace(audioContext: AudioContext) {
        const ws = new Workspace(audioContext);
        const id = generateId();
        const project = new Project(ws);
        const selectedClip: Clip = {
            type: "notes",
            clipChannel: "Default Channel",
            notes: [],
            startAtUnit: 0,
            durationUnit: 96 * 4
        };
        const track: PlaylistTrack = {
            trackName: "Track 1",
            clips: [selectedClip],
            isMuted: false,
            trackHeight: 40
        };
        project.playlist.tracks.push(track);
        for (let i = 0; i < 9; i++) {
            project.playlist.tracks.push({ trackName: `Track ${i + 2}`, clips: [], isMuted: false, trackHeight: 40 });
        }

        // Initialize default nodes network
        const midiInputNode = new NoteClipNode(project.nodes.generateNodeId());
        midiInputNode.data.channelName = "Default Channel";

        const pluckNode = new PluckNode(project.nodes.generateNodeId(), ws.audio);
        pluckNode.nodeX = 150;

        const speakerNode = new SpeakerNode(project.nodes.generateNodeId(), ws.audio);
        speakerNode.nodeX = 300;

        project.nodes.nodes.push(midiInputNode, pluckNode, speakerNode);
        project.nodes.connect(midiInputNode.midiOut, pluckNode.midiIn);
        project.nodes.connect(pluckNode.audioOut, speakerNode.speakerPort);

        const wsInterface: WorkspaceInterface = {
            workspace: ws,
            id,
            settings: {
                fancyRendering: true,
                accentColor: [177, 100, 71]
            },
            project,
            selectedClip,
            selectedNode: undefined,
            player: new Player(project),

            setProject(project) {
                // TODO clean up last project
                this.player.stop();

                this.project = project;
                this.player = new Player(project);
            },
        };

        workspaces.set(id, wsInterface);
        return wsInterface;
    }

    export const defaultWorkspace = createWorkspace(new AudioContext({
        latencyHint: "interactive"
    }));
}

// @ts-ignore
globalThis["MixeryUI"] = MixeryUI;