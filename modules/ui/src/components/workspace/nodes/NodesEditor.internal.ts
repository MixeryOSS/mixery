import type { CanvasRenderer } from "@/canvas/CanvasRenderer";
import type { MixeryUI } from "@/handling/MixeryUI";
import { GroupNode, type INodeAny, type IPort, type NodesNetwork, type PortsConnection } from "@mixery/engine";

export namespace internal {
    export function computeNodeViewBox(node: INodeAny, x: number, y: number) {
        const { nodeX, nodeY } = node;
        const inputs = node.getInputPorts();
        const outputs = node.getOutputPorts();
        const totalPorts = inputs.length + outputs.length;
        const renderX = nodeX + x, renderY = nodeY + y;
        const renderWidth = node.nodeWidth;
        const renderHeight = totalPorts > 0
            ? 22 + totalPorts * 18
            : node.typeId == GroupNode.ID? 48
            : 17;
        return { renderX, renderY, renderWidth, renderHeight };
    }

    export function linkConnection(wire: PortsConnection, network: NodesNetwork) {
        const fromNode = network.nodes.find(v => v.nodeId == wire.from[0]);
        const toNode = network.nodes.find(v => v.nodeId == wire.to[0]);
        if (!fromNode || !toNode) return undefined;
    
        const fromPortIndex = fromNode.getOutputPorts().findIndex(v => v.portId == wire.from[1]);
        const toPortIndex = toNode.getInputPorts().findIndex(v => v.portId == wire.to[1]);
        if (fromPortIndex == -1 || toPortIndex == -1) return undefined;
    
        return { fromNode, toNode, fromPortIndex, toPortIndex };
    }

    export function computeConnectionGeometry(wire: PortsConnection, network: NodesNetwork, x: number, y: number) {
        const linked = linkConnection(wire, network);
        if (!linked) return undefined;
    
        const { fromNode,toNode, fromPortIndex, toPortIndex } = linked;
        const fromX = x + fromNode.nodeX + fromNode.nodeWidth - 2;
        const fromY = y + fromNode.nodeY + 28 + (fromNode.getInputPorts().length + fromPortIndex) * 18;
        const toX = x + toNode.nodeX + 2;
        const toY = y + toNode.nodeY + 28 + toPortIndex * 18;
        return { fromX, fromY, toX, toY, fromNode, toNode, fromPortIndex, toPortIndex };
    }

    export function drawNodeBackground(renderer: CanvasRenderer, geom: ReturnType<typeof computeNodeViewBox>, outlineColor: string, outlineWidth = 1) {
        renderer.begin().roundRect(geom.renderX, geom.renderY, geom.renderWidth, geom.renderHeight, 4).fill("#1f1f1f").end();
        renderer.fillRoundRect(geom.renderX, geom.renderY, geom.renderWidth, 16, 4, "#4f4f4f");
        renderer.begin().roundRect(geom.renderX, geom.renderY, geom.renderWidth, geom.renderHeight, 4).stroke(outlineColor, outlineWidth).end();
    }

    export function drawNode(renderer: CanvasRenderer, node: INodeAny, workspace: MixeryUI.WorkspaceView, x: number, y: number) {
        const inputs = node.getInputPorts();
        const outputs = node.getOutputPorts();
        const accent = renderer.canvas instanceof HTMLElement
            ? window.getComputedStyle(renderer.canvas).getPropertyValue("--color-accent")
            : `hsl(${workspace.settings.accentColor[0]}deg, ${workspace.settings.accentColor[1]}%, ${workspace.settings.accentColor[2]}%)`;
        const geom = computeNodeViewBox(node, x, y);
        const { renderX, renderY, renderWidth, renderHeight } = geom;

        const selected = node == workspace.selectedNode;
        const nodeName = node.nodeName ?? node.typeId;

        if (node.typeId == GroupNode.ID) {
            for (let i = 6; i >= 0; i -= 3) {
                renderer.ctx.translate(-i, -i);
                drawNodeBackground(renderer, geom, "#7f7f7f", 1);
                renderer.ctx.translate(i, i);
            }
        }

        drawNodeBackground(renderer, geom, selected? "#ffffff" : "#7f7f7f", selected? 2 : 1);
        renderer.fillText(nodeName, renderX + 4, renderY + 12, "12px Nunito Sans", "#ffffff");

        if (node.typeId == GroupNode.ID) {
            if (node.getInputPorts().length + node.getOutputPorts().length == 0) {
                renderer.ctx.textAlign = "center";
                renderer.fillText("Double-click to", renderX + renderWidth / 2, renderY + 12 + 17, "12px Nunito Sans", "#ffffff");
                renderer.fillText("edit this group", renderX + renderWidth / 2, renderY + 12 + 30, "12px Nunito Sans", "#ffffff");
                renderer.ctx.textAlign = "left";
            }

            renderer.begin()
            .rect(renderX + renderWidth - 12 + 0.5, renderY + 4 + 0.5, 6, 6)
            .rect(renderX + renderWidth - 14 + 0.5, renderY + 6 + 0.5, 6, 6)
            .stroke("#ffffff", 1)
            .end();
        }

        let currentY = renderY + 20;
        inputs.forEach(port => currentY = drawPort(renderer, port, "input", renderWidth, renderX, currentY));
        outputs.forEach(port => currentY = drawPort(renderer, port, "output", renderWidth, renderX, currentY));
        if (selected) {
            renderer.begin()
            .roundRect(renderX - 6, renderY - 6, renderWidth + 12, renderHeight + 12, 7)
            .stroke("#0000007f", 4)
            .stroke(accent, 2)
            .end();
        }
    }

    export function drawPort(renderer: CanvasRenderer, port: IPort<any>, type: "input" | "output", width: number, x: number, y: number) {
        const portName = port.portName ?? port.portId;
        const textWidth = renderer.ctx.measureText(portName).width;
        const portColor = getPortColor(port.type);
        const portStroke = "#000000";
        const portLabelStroke = port.type == "mixery:group_placeholder_port"? "#ffffff" : "#00000000";

        renderer.ctx.globalAlpha = 0.35;
        renderer.begin().roundRect(x + 4, y, width - 8, 16, 4).fill(portColor);
        renderer.ctx.globalAlpha = 1;
        renderer.stroke(portLabelStroke, 1.2).end();

        renderer.fillText(portName, x + (type == "output"? (width - textWidth - 8) : 8), y + 12, "12px Nunito Sans", "#ffffff");

        let tX = 0;
        switch (type) {
            case "input": tX = 1; break;
            case "output": tX = width - 5; break;
            default: break;
        }
        
        renderer.ctx.translate(x + tX, y + 4);
        renderer.begin().roundRect(0, 0, 4, 8, 1)
        .fill(portColor)
        .stroke(portStroke, 1)
        .end();
        renderer.ctx.translate(-x - tX, -y - 4);

        return y + 18;
    }

    export function getPortColor(type: string) {
        switch (type) {
            case "mixery:midi": return "#ffaf5c";
            case "mixery:signal": return "#c187ff";
            case "mixery:group_placeholder_port": return "#7f7f7f";
            default: return "#ff5c5c";
        }
    }

    export function drawWire(
        renderer: CanvasRenderer,
        wire: PortsConnection,
        network: NodesNetwork,
        x: number, y: number,
        targettingWire?: PortsConnection
    ) {
        const geom = internal.computeConnectionGeometry(wire, network, x, y);
        if (!geom) return;

        const { fromX, fromY, toX, toY } = geom;
        const fromPort = geom.fromNode.getOutputPorts()[geom.fromPortIndex];

        renderer.begin()
        .pointer(fromX, fromY)
        .line(toX, toY);
        if (targettingWire == wire) renderer.stroke("#ff0000", 8);
        renderer.stroke("#0000007f", 4)
        .stroke(getPortColor(fromPort.type), 2)
        .end();
    }
}