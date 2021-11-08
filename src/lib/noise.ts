import { Wav } from './wav';
import ms from 'ms';
import { floor, max, mean, min, std } from 'mathjs';
/**
 * 
 * @param {number} noiseCutLength - slice length in that's used to calcuate noise level ('0.1s', '0.2m')
 * @returns 
 */
export function calcuateNoise(wav: Wav, noiseSliceLength: string): number {
    const sliceLengthMs = ms(noiseSliceLength);
    const samplesCount = sliceLengthMs / wav.sampleLength;

    const noiseSamples = wav.samplesEnergy.slice(0, samplesCount);
    return mean(noiseSamples) + 2 * std(noiseSamples);
}