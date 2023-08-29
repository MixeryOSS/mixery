export namespace Waveforms {
    function waitInstantToAvoidMainThreadFreeze() {
        return new Promise<void>(resolve => setTimeout(() => resolve()));
    }

    export interface WaveformChannelData {
        readonly sampleRate: number;
        readonly neg: Float32Array;
        readonly pos: Float32Array;
    }
    
    export async function sampleChannelWaveform(
        audioSampleRate: number,
        waveformSampleRate: number,
        channel: Float32Array
    ): Promise<WaveformChannelData> {
        const maxSamples = Math.floor(channel.length * waveformSampleRate / audioSampleRate);
        const audioPerWaveform = channel.length / maxSamples;
        const data: WaveformChannelData = {
            sampleRate: waveformSampleRate,
            neg: new Float32Array(maxSamples),
            pos: new Float32Array(maxSamples)
        };

        for (let waveformSample = 0; waveformSample < maxSamples; waveformSample++) {
            const initialAudioSample = Math.floor(waveformSample * audioSampleRate / waveformSampleRate);
            let val: number;

            data.pos[waveformSample] = 0;
            data.neg[waveformSample] = 0;

            for (let audioSample = 0; audioSample < audioPerWaveform * 1.3; audioSample++) {
                const idx = initialAudioSample + audioSample;
                if (idx >= channel.length) break;
                val = channel[idx];
                if (val > 0) data.pos[waveformSample] = Math.max(data.pos[waveformSample], val);
                else data.neg[waveformSample] = Math.min(data.neg[waveformSample], val);
            }
            
            // Flip
            data.neg[waveformSample] = -data.neg[waveformSample];

            if ((waveformSample % (waveformSampleRate * 12)) == 0) {
                await waitInstantToAvoidMainThreadFreeze();
            }
        }

        return data;
    }

    export async function sampleWaveform(
        buffer: AudioBuffer,
        waveformSampleRate: number = 96
    ): Promise<WaveformChannelData[]> {
        const channels: WaveformChannelData[] = [];
        
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(await sampleChannelWaveform(buffer.sampleRate, waveformSampleRate, buffer.getChannelData(i)));
        }

        return channels;
    }
}