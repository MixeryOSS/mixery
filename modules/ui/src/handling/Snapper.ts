export namespace Snapper {
    export function snap(position: number, segmentSize: number) {
        let segmentIndex = position / segmentSize;
        return Math.round(segmentIndex) * segmentSize;
    }
}