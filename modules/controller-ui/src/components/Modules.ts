export namespace Modules {
    export interface ModuleBase<T extends string> {
        type: T;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    export interface KeyboardModule extends ModuleBase<"keyboard"> {
        channel: number;
    }

    export interface DrumPadModule extends ModuleBase<"drumpad"> {
        channel: number;
        matrix: [number, number];
    }

    export type Module = KeyboardModule | DrumPadModule;
}