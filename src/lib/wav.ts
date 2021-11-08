import { WaveFile } from 'wavefile';
import fs from 'fs';
import { promisify } from 'util';
import { floor } from 'mathjs';
const readFileAsync = promisify(fs.readFile);

export class Wav {
    public originalSamples: any;
    public sampleRate: number;
    public numChannels: number;
    public duration: number; //ms
    public samples: number[];
    public sampleLength: number;
    public bitsPerSample: number;
    public samplesEnergy: number[];

    constructor(buffer: Buffer) {
        this.numChannels = buffer.readUInt16LE(22);
        this.sampleRate = buffer.readUInt32LE(24);
        this.bitsPerSample = buffer.readUInt16LE(34);
        this.sampleLength = 1000 / this.sampleRate;
        this.originalSamples = [];
        this.samples = [];

        const wf = new WaveFile(buffer);
        const maxValue = Math.pow(2, this.bitsPerSample) - 1;
        const normValue = floor(maxValue / 2);
        this.originalSamples = wf.getSamples(false, Int32Array);
        for (let si = 0; si < this.originalSamples[0].length; si++) {
            let sample = 0;
            for (let ci = 0; ci < this.numChannels; ci++) {
                if (this.bitsPerSample <= 8) {
                    sample += this.originalSamples[ci][si];
                } else {
                    sample += floor(255 * (this.originalSamples[ci][si] + normValue) / maxValue);
                }
            }
            sample /= this.numChannels;
            this.samples.push(sample);
        }

        this.duration = (this.originalSamples[0].length / this.sampleRate) * 1000;
        this.samplesEnergy = this.samples.map(s => (s - 128) * (s - 128));
    }
}

export async function loadWavFromFile(filePath: string): Promise<Wav> {
    const wavFileData = await readFileAsync(filePath);
    return new Wav(wavFileData);
}

export default {
    loadWavFromFile
};