import { GlobalRegistries, IPort, Identifier, SignalPort } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

export class SpeakerNode implements INode<SpeakerNode, any> {
    static readonly ID = "mixery:speaker";
    typeId: Identifier = SpeakerNode.ID;
    nodeName?: string = "Speaker Output";
    nodeX = 0;
    nodeY = 0;
    nodeWidth = 100;

    controls: NodeControl<any>[] = [];
    inputs: IPort<any>[] = [];
    outputs: IPort<any>[] = [];

    speakerPort: SignalPort;

    constructor(public readonly nodeId: string, audioContext: BaseAudioContext) {
        this.speakerPort = new SignalPort(this, "speaker", audioContext.destination);
        this.speakerPort.portName = "Destination";
        this.inputs.push(this.speakerPort);
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return this.inputs;
    }

    getOutputPorts(): IPort<any>[] {
        return this.outputs;
    }

    saveNode() {
        return {}; // Return nothing
    }

    static createFactory(): NodeFactory<SpeakerNode, any> {
        return {
            typeId: SpeakerNode.ID,
            label: "Speaker Output",
            createNew(workspace, nodeId) {
                return new SpeakerNode(nodeId, workspace.audio);
            },
            createExisting(workspace, nodeId, data) {
                return new SpeakerNode(nodeId, workspace.audio);
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(SpeakerNode.ID, SpeakerNode.createFactory());