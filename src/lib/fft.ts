import ms from 'ms';
import { Wav } from './wav';
const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;
const windowFunction = require('window-function');
const winApply = require('window-function/apply');

export enum WindowFunctionType {
    HAMMING, HANN, TRIANGULAR, BLACKMAN, NONE
}

const windowFunctions = {
    [WindowFunctionType.HAMMING]: windowFunction.hamming,
    [WindowFunctionType.HANN]: windowFunction.hann,
    [WindowFunctionType.TRIANGULAR]: windowFunction.triangular,
    [WindowFunctionType.BLACKMAN]: windowFunction.blackman
};

export class WavFFT {
    private _wav: Wav;

    /**
     *
     */
    constructor(wav: Wav) {
        this._wav = wav;
    }

    public fft(windowSize: string, windowFunctionType: WindowFunctionType, windowIndex: number): Map<number, number> {
        const winSize = Math.floor(ms(windowSize) / this._wav.sampleLength);
        const exp = Math.ceil(Math.log2(winSize));
        const missing = Math.pow(2, exp) - winSize;
        const result = new Map<number, number>();

        let samples = this._wav.samplesEnergy.slice(windowIndex * winSize, windowIndex * winSize + winSize);

        samples = [...samples, ...Array(missing + winSize - samples.length).fill(0)];
        if (windowFunctionType != WindowFunctionType.NONE) {
            samples = winApply(samples, windowFunctions[windowFunctionType]);
        }
        let x = fft(samples);
        const frequencies = fftUtil.fftFreq(x, this._wav.sampleRate);
        const magnitudes = fftUtil.fftMag(x);

        frequencies.map((f: any, ix: string | number) => {
            const freq = Math.floor(f);
            if (!result.has(freq)) {
                result.set(freq, 0);
            }
            result.set(freq, result.get(freq) + magnitudes[ix]);

            return freq;
        });

        for (const freq of result.keys()) {
            result.set(freq, result.get(freq));
        }

        return result;
    }

    public sonogram(windowSize: string, windowFunctionType: WindowFunctionType): Map<number, number>[] {
        const winSize = Math.floor(ms(windowSize) / this._wav.sampleLength);
        const sonogram = [];

        for (let wi = 0; this._wav.samplesEnergy.slice(wi * winSize, wi * winSize + winSize).length > 0; wi++) {
            sonogram.push(this.fft(windowSize, windowFunctionType, wi));
        }

        return sonogram;
    }
}