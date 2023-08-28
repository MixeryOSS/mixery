export interface ContextMenuEntry {
    label: string;
    submenu?: ContextMenuEntry[];
    onClick?(): any;
}