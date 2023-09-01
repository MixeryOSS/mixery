<script setup lang="ts">
import MixeryWindow from '../../windows/MixeryWindow.vue';
import TitlebarButton from '../../windows/TitlebarButton.vue';
import MixeryIcon from '../../icons/MixeryIcon.vue';
import WindowToolsbar from '../../windows/WindowToolsbar.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { CanvasRenderer } from '@/canvas/CanvasRenderer';
import { useTrackableXY, useParentState } from '../../composes';
import { MixeryUI } from '@/handling/MixeryUI';
import { type IPort, type INode, type PortsConnection, GroupNode, GroupPlaceholderPort } from '@mixery/engine';
import type { ContextMenuEntry } from '../../contextmenus/ContextMenuEntry';
import { traverse } from '@/utils';
import { RenderingHelper } from '@/canvas/RenderingHelper';
import { DoubleClickHandler } from '@/handling/DoubleClickHandler';
import { internal } from './NodesEditor.internal';

const props = defineProps<{
    visible: boolean,
    workspaceId: string,
    contextMenu?: ContextMenuEntry[],
    contextMenuX: number,
    contextMenuY: number,
    updateHandle: number
}>();
const emits = defineEmits([
    "update:visible",
    "update:contextMenu",
    "update:contextMenuX",
    "update:contextMenuY",
    "update:updateHandle"
]);

const updateHandle = useParentState("updateHandle", props, emits);
const grid = ref(50); // 50px grid size
const zoomRatio = ref(1);
const wireCutterMode = ref(false);

const contextMenu = useParentState<ContextMenuEntry[] | undefined>("contextMenu", props, emits);
const contextMenuX = useParentState<number>("contextMenuX", props, emits);
const contextMenuY = useParentState<number>("contextMenuY", props, emits);

const canvas = ref<HTMLCanvasElement>();
const canvasRenderer = ref<CanvasRenderer>();
const zoomBar = ref<HTMLDivElement>();

function getWorkspace() { return MixeryUI.workspaces.get(props.workspaceId)!; }
function getCurrentGroup() {
    const stack = getWorkspace().nodesStack;
    return stack[stack.length - 1];
}

const x = computed({
    get() {
        updateHandle.value;
        return getCurrentGroup().viewX;
    },
    set(v) {
        updateHandle.value++;
        getCurrentGroup().viewX = v;
    }
});
const y = computed({
    get() {
        updateHandle.value;
        return getCurrentGroup().viewY;
    },
    set(v) {
        updateHandle.value++;
        getCurrentGroup().viewY = v;
    }
});

const selectedNodeRefForRendering = ref(getWorkspace().selectedNode);
const groupsStackRef = computed(() => {
    updateHandle.value;
    return getWorkspace().nodesStack.map(v => v.networkName);
});

function distance(x1: number, y1: number, x2: number, y2: number) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    return Math.sqrt(vx * vx + vy * vy);
}

function getPortColor(type: string) {
    switch (type) {
        case "mixery:midi": return "#ffaf5c";
        case "mixery:signal": return "#c187ff";
        case "mixery:group_placeholder_port": return "#7f7f7f";
        default: return "#ff5c5c";
    }
}

let lastNode: INode<any, any> | undefined;
let lastPort: IPort<any> | undefined;
let lastPortType: "input" | "output" | undefined;
let targettingPort: IPort<any> | undefined;
let targettingWire: PortsConnection | undefined;
let isMoving = false;

onMounted(() => {
    const renderer = new CanvasRenderer(canvas.value!, render);
    canvasRenderer.value = renderer;
    renderer.useObserveResize();
    getWorkspace().rendering.registerCallback([
        RenderingHelper.Keys.All,
        RenderingHelper.Keys.NodesEditor
    ], () => render());

    const gridColor = "#ffffff2f";
    const centerColor = "#ffffff7f";

    function render() {
        if (!props.visible) return;
        if (!canvas.value) return;
        renderer.startRender();
        const accent = window.getComputedStyle(canvas.value!).getPropertyValue("--color-accent");

        const centerX = x.value;
        const centerY = y.value;
        const viewWidth = canvas.value.offsetWidth / zoomRatio.value;
        const viewHeight = canvas.value.offsetHeight / zoomRatio.value;
        renderer.ctx.scale(zoomRatio.value, zoomRatio.value);
        renderer.ctx.translate(viewWidth / 2, viewHeight / 2);

        // Render grid
        const gridSize = grid.value;
        const gridXOffset = centerX % gridSize;
        const gridYOffset = centerY % gridSize;
        const gridHalfWidth = Math.ceil(viewWidth / 2 / gridSize);
        const gridHalfHeight = Math.ceil(viewHeight / 2 / gridSize);
        for (let x = -gridHalfWidth; x <= gridHalfWidth; x++) {
            for (let y = -gridHalfHeight; y <= gridHalfHeight; y++) {
                const originX = gridXOffset + x * gridSize;
                const originY = gridYOffset + y * gridSize;
                renderer.fillRect(originX - 2, originY - 2, 4, 4, gridColor);
            }
        }

        // Render center
        renderer.fillRect(x.value - 10, y.value - 1, 20, 2, centerColor);
        renderer.fillRect(x.value - 1, y.value - 10, 2, 20, centerColor);

        getCurrentGroup().nodes.forEach(node => internal.drawNode(renderer, node, getWorkspace(), x.value, y.value));
        getCurrentGroup().connections.forEach(wire => internal.drawWire(renderer, wire, getCurrentGroup(), x.value, y.value));

        // Render dragging wire
        if (lastPort) {
            const fromPortIndex = (lastPortType == "output"? lastPort.node.getOutputPorts() : lastPort.node.getInputPorts()).indexOf(lastPort);
            const fromX = x.value + lastPort.node.nodeX + (lastPortType == "output"? lastPort.node.nodeWidth - 2 : 2);
            const fromY = y.value + lastPort.node.nodeY + 28 + (fromPortIndex + (lastPortType == "output"? lastPort.node.getInputPorts().length : 0)) * 18;
            let toX = canvasRenderer.value!.mouseX / zoomRatio.value - viewWidth / 2;
            let toY = canvasRenderer.value!.mouseY / zoomRatio.value - viewHeight / 2;

            if (targettingPort) {
                let toPortIndex = (lastPortType == "output"? targettingPort.node.getInputPorts() : targettingPort.node.getOutputPorts()).indexOf(targettingPort);
                toX = x.value + targettingPort.node.nodeX + (lastPortType == "output"? 2 : targettingPort.node.nodeWidth - 2);
                toY = y.value + targettingPort.node.nodeY + 28 + ((lastPortType == "output"? 0 : targettingPort.node.getInputPorts().length) + toPortIndex) * 18;
            }

            renderer.begin()
            .pointer(fromX, fromY)
            .line(toX, toY)
            .stroke("#0000007f", 4)
            .stroke(accent, 2)
            .end();
        }
    }

    useTrackableXY(zoomBar.value!, zoomRatio, undefined, {
        scale: 0.01,
        minX: 0.1,
        maxX: 10
    });
});

watch(x, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor));
watch(y, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor));
watch(zoomRatio, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor));
watch(updateHandle, () => getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor));

function addNode(event: MouseEvent) {
    const workspaceUI = traverse(event.target as HTMLElement, v => v.classList.contains("workspace"), v => v.parentElement);
    const workspaceBox = workspaceUI?.getBoundingClientRect();
    contextMenuX.value = event.pageX - (workspaceBox?.x ?? 0);
    contextMenuY.value = event.pageY - (workspaceBox?.y ?? 0);
    const entries: ContextMenuEntry[] = [];
    getWorkspace().workspace.registries.nodeFactories.forEach((id, factory) => {
        if (factory.hidden) return;

        entries.push({
            label: factory.label,
            async onClick() {
                const createTask = factory.createNew(getWorkspace().project, getCurrentGroup().generateNodeId());
                if (createTask instanceof Promise) getWorkspace().workspace.loadingManager.add(createTask);
                const node = (await createTask) as INode<any, any>;
                node.nodeX = -x.value - node.nodeWidth / 2;
                node.nodeY = -y.value;
                getWorkspace().selectedNode = node;
                selectedNodeRefForRendering.value = node;
                getCurrentGroup().nodes.push(node);
                getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
            },
        });
    });
    contextMenu.value = entries;
}

function nodeClick(event: PointerEvent, cb: (node: INode<any, any>, port?: IPort<any>, portType?: "input" | "output") => any) {
    const nodes = getCurrentGroup().nodes;
    const pointerX = (event.offsetX - canvas.value!.offsetWidth / 2) / zoomRatio.value;
    const pointerY = (event.offsetY - canvas.value!.offsetHeight / 2) / zoomRatio.value;

    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const { renderX, renderY, renderWidth, renderHeight } = internal.computeNodeViewBox(node, x.value, y.value);

        if (
            (pointerX >= renderX && pointerX <= renderX + renderWidth) &&
            (pointerY >= renderY && pointerY <= renderY + renderHeight)
        ) {
            // TODO ports hit test
            const inputs = node.getInputPorts();
            const outputs = node.getOutputPorts();

            for (let i = 0; i < inputs.length; i++) {
                const port = inputs[i];
                const portY = renderY + 20 + i * 18;
                if (pointerY >= portY && pointerY <= portY + 16) {
                    cb(node, port, "input");
                    return;
                }
            }

            for (let i = 0; i < outputs.length; i++) {
                const port = outputs[i];
                const portY = renderY + 20 + (inputs.length + i) * 18;
                if (pointerY >= portY && pointerY <= portY + 16) {
                    cb(node, port, "output");
                    return;
                }
            }

            cb(node);
            return;
        }
    }
}

const doubleclick = new DoubleClickHandler(() => getWorkspace().settings.doubleClickSpeed, (event) => {
    nodeClick(event, (node, port, portType) => {
        if (node instanceof GroupNode) {
            getWorkspace().nodesStack.push(node.children);
            getWorkspace().selectedNode = undefined;
            selectedNodeRefForRendering.value = undefined;
            updateHandle.value++;
        }
    });
});

// TODO should we have multiple tools for nodes editor?
function onPointerDown(event: PointerEvent) {
    doubleclick.mouseDown(event);

    canvasRenderer.value!.mouseX = event.offsetX;
    canvasRenderer.value!.mouseY = event.offsetY;

    if (targettingWire) {
        const linked = internal.linkConnection(targettingWire, getCurrentGroup());
        if (!linked) return;
        getCurrentGroup().disconnect(linked.fromNode.getOutputPorts()[linked.fromPortIndex], linked.toNode.getInputPorts()[linked.toPortIndex]);
        targettingWire = undefined;
        wireCutterMode.value = false;
        getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
        return;
    }

    let nodeClicked: INode<any, any> | undefined;
    nodeClick(event, (node, port, type) => {
        getWorkspace().selectedNode = node;
        selectedNodeRefForRendering.value = node;
        nodeClicked = lastNode = node;
        lastPort = port;
        lastPortType = type;
        getCurrentGroup().nodes.splice(getCurrentGroup().nodes.indexOf(node), 1);
        getCurrentGroup().nodes.push(node);
        getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
    });

    if (!nodeClicked) isMoving = true;
}
function onPointerMove(event: PointerEvent) {
    doubleclick.clear();

    canvasRenderer.value!.mouseX = event.offsetX;
    canvasRenderer.value!.mouseY = event.offsetY;

    if (isMoving) {
        x.value += event.movementX / zoomRatio.value;
        y.value += event.movementY / zoomRatio.value;
        return;
    }

    const { connections } = getCurrentGroup();
    const viewWidth = canvas.value!.offsetWidth / zoomRatio.value;
    const viewHeight = canvas.value!.offsetHeight / zoomRatio.value;
    const worldX = canvasRenderer.value!.mouseX / zoomRatio.value - viewWidth / 2;
    const worldY = canvasRenderer.value!.mouseY / zoomRatio.value - viewHeight / 2;
    const solidify = 5;

    let shouldUpdate = targettingWire != undefined;
    targettingWire = undefined;
    for (let i = 0; i < connections.length; i++) {
        const connection = connections[i];
        const geom = internal.computeConnectionGeometry(connection, getCurrentGroup(), x.value, y.value);
        if (!geom) continue;

        // Pass 1: AABB
        const minX = Math.min(geom.fromX, geom.toX);
        const minY = Math.min(geom.fromY, geom.toY);
        const maxX = Math.max(geom.fromX, geom.toX);
        const maxY = Math.max(geom.fromY, geom.toY);
        if (
            worldX >= minX - solidify &&
            worldX <= maxX + solidify &&
            worldY >= minY - solidify &&
            worldY <= maxY + solidify
        ) {
            // Pass 2: Precise line collision
            const length = distance(geom.fromX, geom.fromY, geom.toX, geom.toY);
            const d1 = distance(worldX, worldY, geom.fromX, geom.fromY);
            const d2 = distance(worldX, worldY, geom.toX, geom.toY);

            if (d1 + d2 >= length - 0.5 && d1 + d2 <= length + 0.5) {
                if (targettingWire == connection) shouldUpdate = false;
                targettingWire = connection;
                break;
            }
        }
    }

    if (shouldUpdate) {
        getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
        wireCutterMode.value = !!targettingWire;
    }

    if (!lastNode) return;
    if (lastPort) {
        targettingPort = undefined;

        nodeClick(event, (node, port, type) => {
            if (lastPortType == type) return;
            if (lastNode == node) return;

            if (
                lastPort?.type == port?.type ||
                lastPort?.type == "mixery:group_placeholder_port" ||
                port?.type == "mixery:group_placeholder_port"
            ) {
                targettingPort = port;
            }
        });
    } else {
        lastNode.nodeX += event.movementX / zoomRatio.value;
        lastNode.nodeY += event.movementY / zoomRatio.value;
    }

    getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
}
function onPointerUp(event: PointerEvent) {
    isMoving = false;

    if (lastNode) {
        if (lastPort && targettingPort) {
            if (lastPort instanceof GroupPlaceholderPort) {
                lastPort.handlePlaceholderConnectTo(targettingPort);
            } else if (targettingPort instanceof GroupPlaceholderPort) {
                targettingPort.handlePlaceholderConnectFrom(lastPort);
            } else {
                if (lastPortType == "output") getCurrentGroup().connect(lastPort, targettingPort);
                else getCurrentGroup().connect(targettingPort, lastPort);
            }
        }

        lastNode = undefined;
        lastPort = undefined;
        lastPortType = undefined;
        targettingPort = undefined;
        getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);
    }

    if (event.pointerType != "mouse") {
        canvasRenderer.value!.mouseX = -1;
        canvasRenderer.value!.mouseY = -1;
    }
}

function onWheel(event: WheelEvent) {
    const isTouchpad = Math.abs((event as any).wheelDeltaY) != 120 && event.deltaMode == 0;
    let wheelX = event.deltaX;
    let wheelY = event.deltaY * (isTouchpad? 1 : 0.5);

    if (event.shiftKey) {
        let aux = wheelX;
        wheelX = wheelY;
        wheelY = aux;
    }

    if (event.ctrlKey) {
        let zoomDelta = event.shiftKey? wheelX : wheelY;
        zoomRatio.value = Math.max(zoomRatio.value - zoomDelta / (isTouchpad? 50 : 200), 0.1);
        event.preventDefault();
    } else {
        x.value -= wheelX / zoomRatio.value;
        y.value -= wheelY / zoomRatio.value;
    }
}

function deleteNode(node: INode<any, any>) {
    if (node.canNotBeDeleted) return;

    getCurrentGroup().connections.map(wire => {
        if (!(wire.from[0] == node.nodeId || wire.to[0] == node.nodeId)) return undefined;

        const linked = internal.linkConnection(wire, getCurrentGroup());
        if (!linked) return;
        const fromPort = linked.fromNode.getOutputPorts()[linked.fromPortIndex];
        const toPort = linked.toNode.getInputPorts()[linked.toPortIndex];
        return [fromPort, toPort];
    }).forEach(a => {
        if (!a) return;
        const [fromPort, toPort] = a;
        getCurrentGroup().disconnect(fromPort, toPort);
    });

    getCurrentGroup().nodes.splice(getCurrentGroup().nodes.indexOf(node));
    getWorkspace().selectedNode = undefined;
    selectedNodeRefForRendering.value = undefined;
}

function navigateUp(index: number) {
    if (index < 0) index = 0;
    const currentIndex = getWorkspace().nodesStack.length - 1;
    if (index >= currentIndex) return;

    for (let i = 0; i < currentIndex - index; i++) getWorkspace().nodesStack.pop();
    getWorkspace().selectedNode = undefined;
    selectedNodeRefForRendering.value = undefined;
    updateHandle.value++;
}
</script>

<template>
    <MixeryWindow title="Nodes" :width="900" :height="500" resizable :visible="props.visible">
        <template v-slot:title-left>
            <TitlebarButton is-icon><MixeryIcon type="menu" /></TitlebarButton>
        </template>
        <template v-slot:title-right>
            <TitlebarButton @click="emits('update:visible', !props.visible)" is-icon><MixeryIcon type="close" /></TitlebarButton>
        </template>
        <template v-slot:toolsbars v-if="groupsStackRef.length > 1">
            <WindowToolsbar>
                <TitlebarButton @click="navigateUp(getWorkspace().nodesStack.length - 2)">..</TitlebarButton>
                <template v-for="(name, index) in groupsStackRef">
                    <TitlebarButton @click="navigateUp(index)" :highlight="index == groupsStackRef.length - 1">{{ name }}</TitlebarButton>
                </template>
            </WindowToolsbar>
        </template>
        <canvas
            ref="canvas"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @wheel="onWheel"
            :class="{ wireCutterMode: wireCutterMode }"
        ></canvas>
        <div class="editor-controls">
            <div class="button" ref="zoomBar">
                <MixeryIcon type="add" />
                <div class="label">{{ (zoomRatio * 100).toFixed(0) }}%</div>
            </div>
            <div class="button" @click="addNode">
                <MixeryIcon type="add" />
                <div class="label">Add</div>
            </div>
        </div>
        <div class="node-controls">
            <input
                class="node-name"
                :value="selectedNodeRefForRendering? (selectedNodeRefForRendering.nodeName ?? selectedNodeRefForRendering.typeId) : 'Not selected'"
                @input="getWorkspace().selectedNode? (getWorkspace().selectedNode!.nodeName = ($event.target as any).value) : 1; getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);"
            >
            <div class="node-control-entry" v-if="selectedNodeRefForRendering?.typeId == GroupNode.ID">
                <div class="node-control-label">Double-click to open</div>
            </div>
            <div class="node-control-entry" v-for="control in (selectedNodeRefForRendering?.getControls() ?? [])">
                <div class="node-control-label">{{ control.label }}</div>
                <input
                    :type="(typeof control.value == 'string'? 'text' : 'number')"
                    class="node-control-input"
                    :value="control.value"
                    @input="control.value = (typeof control.value == 'string'? ($event.target as any).value : +($event.target as any).value)"
                >
            </div>
            <div class="button delete"
                @click="deleteNode(getWorkspace().selectedNode!); getWorkspace().rendering.redrawRequest(RenderingHelper.Keys.NodesEditor);"
                v-if="selectedNodeRefForRendering && !selectedNodeRefForRendering.canNotBeDeleted"
            >Delete Node</div>
        </div>
    </MixeryWindow>
</template>

<style scoped lang="scss">
canvas {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;

    &:active {
        cursor: grabbing;
    }

    &.wireCutterMode {
        cursor:
            url(../../assets/cursors/scissor.svg) 17.5 17.5,
            not-allowed;
    }
}

.editor-controls {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 0;

    > * {
        background-color: #171717;
        border-radius: 8px;
        margin-bottom: 2px;
        border: 1px solid #050505;
        box-shadow: 0 0 8px #000000;
        transition: 0.1s background-color;
        white-space: nowrap;

        &:hover {
            background-color: #1f1f1f;
        }

        &:active {
            background-color: #272727;
        }
    }

    .button {
        display: flex;
        flex-direction: row;
        padding: 2px 4px;
        height: 25px;
        width: fit-content;
        touch-action: none;

        .label {
            margin: 0 4px;
        }
    }
}

.node-controls {
    position: absolute;
    right: 8px;
    top: 8px;
    padding: 4px 4px;
    background-color: #171717;
    border-radius: 8px;
    border: 1px solid #050505;
    box-shadow: 0 0 8px #000000;
    display: flex;
    flex-direction: column;

    > * {
        margin-bottom: 4px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .button {
        background-color: #ffffff0f;
        border: 1px solid #ffffff1f;
        height: 24px;
        padding: 0 4px;
        border-radius: 4px;
        text-align: center;

        &:hover {
            background-color: #ffffff1f;
        }

        &.delete {
            background-color: #ff5c5c;
            border: 1px solid #ff7f7f;

            &:hover {
                background-color: #ff7f7f;
            }
        }
    }

    input {
        font-family: unset;
        background-color: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        color: unset;
        display: inline-block;
        padding: unset;
        outline: none;
        height: 24px;
        padding: 0 4px;
        transition: 0.1s background-color, 0.1s border;
        font-size: 14px;

        &:hover {
            background-color: #ffffff0f;
            border: 1px solid #ffffff1f;
        }
    }

    .node-control-entry {
        display: flex;
        flex-direction: column;

        .node-control-label {
            font-size: 12px;
            color: #8c8c8c;
            padding: 0 4px;
        }
    }
}
</style>