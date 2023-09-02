import { GlobalRegistries, IPort, Identifier, SignalPort } from "../index.js";
import { INode, NodeControl, NodeFactory } from "./INode.js";

export class ConstantNode implements INode<ConstantNode, number> {
    static readonly ID = "mixery:constant";
    typeId: Identifier = ConstantNode.ID;
    nodeName?: string = "Constant";
    nodeX: number = 0;
    nodeY: number = 0;
    nodeWidth: number = 100;

    backed: ConstantSourceNode;
    control: NodeControl<number>;
    output: SignalPort;

    constructor(public readonly nodeId: string, audioContext: BaseAudioContext) {
        const self = this;
        this.output = new SignalPort(this, "value", audioContext, this.backed = audioContext.createConstantSource());
        this.output.portName = "Value";
        this.backed.start();
        this.control = {
            label: "Value",
            get value() { return self.backed.offset.value; },
            set value(v) { self.backed.offset.value = v; }
        };
    }

    getControls(): NodeControl<any>[] {
        return [this.control];
    }

    getInputPorts(): IPort<any>[] {
        return [];
    }

    getOutputPorts(): IPort<any>[] {
        return [this.output];
    }

    saveNode(): number {
        return this.backed.offset.value;
    }
    
    createCopy(): ConstantNode {
        const node = new ConstantNode(this.nodeId, this.backed.context);
        node.backed.offset.value = this.backed.offset.value;
        return node;
    }

    static createFactory(): NodeFactory<ConstantNode, number> {
        return {
            typeId: ConstantNode.ID,
            label: "Constant",
            createNew(project, context, nodeId) {
                return new ConstantNode(nodeId, project.workspace.audio);
            },
            createExisting(project, context, nodeId, data) {
                const node = new ConstantNode(nodeId, project.workspace.audio);
                node.backed.offset.value = data;
                return node;
            }
        };
    }
}

GlobalRegistries.NODE_FACTORIES.register(ConstantNode.ID, ConstantNode.createFactory());