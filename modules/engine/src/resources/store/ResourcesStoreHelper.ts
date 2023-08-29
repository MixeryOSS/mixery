export interface ResourcesStoreHelper {
    /**
     * Decode audio data into `AudioBuffer`.
     * @param blob Data of the audio file.
     */
    decodeAudioData(blob: Blob): Promise<AudioBuffer>;
}