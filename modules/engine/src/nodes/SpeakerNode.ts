import { IPort, Identifier, SignalPort } from "../index.js";
import { INode, NodeControl } from "./INode.js";

export class SpeakerNode implements INode<SpeakerNode, any> {
    typeId: Identifier = "mixery:speaker";
    nodeName?: string = "Speaker";
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
}