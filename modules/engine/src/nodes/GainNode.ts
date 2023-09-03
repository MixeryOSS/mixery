import { GlobalRegistries, IPort, Identifier, SignalPort } from "../index.js";
import { INode, NodeControl, NodeControls, NodeFactory } from "./INode.js";

export class GainNode implements INode<GainNode, number> {
    static readonly ID = "mixery:gain";
    typeId: Identifier = GainNode.ID;
    nodeName?: string = "Gain";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    controls: NodeControl<any>[] = [];
    signalInput: SignalPort;
    gain: SignalPort;
    signalOutput: SignalPort;

    constructor(public readonly nodeId: string, audio: BaseAudioContext) {
        const gainNode = audio.createGain();
        this.signalInput = new SignalPort(this, "input", audio, gainNode);
        this.signalInput.portName = "Input";

        this.gain = new SignalPort(this, "gain", audio, gainNode.gain);
        this.gain.portName = "Gain";

        this.signalOutput = new SignalPort(this, "output", audio, gainNode);
        this.signalOutput.portName = "Output";

        this.controls.push(NodeControls.makeParamControl("Gain", gainNode.gain));
    }

    getControls(): NodeControl<any>[] {
        return this.controls;
    }

    getInputPorts(): IPort<any>[] {
        return [this.signalInput, this.gain];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.signalOutput];
    }

    saveNode(): number {
        return (this.gain.socket as AudioParam).value;
    }

    createCopy(): GainNode {
        const node = new GainNode(this.nodeId, (this.signalOutput.socket as AudioNode).context);
        (node.gain.socket as AudioParam).value = (this.gain.socket as AudioParam).value;
        throw new Error("Method not implemented.");
    }

    static createFactory(): NodeFactory<GainNode, number> {
        return {
            typeId: GainNode.ID,
            label: "Gain",
            createNew(project, context, nodeId) {
                return new GainNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new GainNode(nodeId, project.workspace.audio);
                (node.gain.socket as AudioParam).value = data;
                return node;
            }
        };
    };
}

GlobalRegistries.NODE_FACTORIES.register(GainNode.ID, GainNode.createFactory());