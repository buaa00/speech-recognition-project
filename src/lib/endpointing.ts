import { floor, mean } from 'mathjs';
import ms from 'ms';
import { Wav } from './wav';

export enum WavWindowLabel {
    NOISE = 0,
    SPEECH = 1
}

export interface WordInfo {
    startWindowIndex: number;
    windowsCount: number;
    startTimeMs: number;
    lengthMs: number;
    startSample: number;
    samplesCount: number;
}

export class WavEndpointing {
    private _wav: Wav;
    private _windowSize: number;
    private _noiseLevel: number;
    private _windowSamplesCount: number;
    private _labels: WavWindowLabel[];

    /**
     *
     */
    constructor(wav: Wav, windowSize: string, noiseLevel: number, p: number, q: number) {
        this._wav = wav;
        this._windowSize = ms(windowSize);
        this._noiseLevel = noiseLevel;
        this._windowSamplesCount = this._windowSize / this._wav.sampleLength;
        this._labels = this.calculateWindowLabels();
        this._labels = this.flattenUp(p);
        this._labels = this.flattenDown(q);
    }

    private calculateWindowLabels(): WavWindowLabel[] {
        const labels: Array<WavWindowLabel> = [];

        for (let wi = 0; this._wav.samplesEnergy.slice(wi, wi + this._windowSamplesCount).length > 0; wi += this._windowSamplesCount) {
            const samples = this._wav.samplesEnergy.slice(wi, wi + this._windowSamplesCount);
            labels.push(mean(samples) > this._noiseLevel ? WavWindowLabel.SPEECH : WavWindowLabel.NOISE);
        }

        return labels;
    }

    private flattenUp(maxDistance: number): WavWindowLabel[] {
        enum STATE {
            NOISE, SIGNAL, MAYBE_NOISE
        };

        let state = STATE.NOISE;
        let nosieLen = 0;

        const newLabels = [...this._labels];

        for (let i = 0; i < newLabels.length; i++) {
            if (state == STATE.NOISE) {
                if (newLabels[i] == WavWindowLabel.SPEECH) {
                    state = STATE.SIGNAL;
                }
            } else if (state == STATE.SIGNAL) {
                if (newLabels[i] == WavWindowLabel.NOISE) {
                    nosieLen = 1;
                    state = STATE.MAYBE_NOISE;
                }
            } else {
                if (newLabels[i] == WavWindowLabel.NOISE) {
                    nosieLen++;
                    continue;
                }

                if (nosieLen < maxDistance) {
                    let tmp = i;
                    tmp--;
                    for (let x = 0; x < nosieLen; x++) {
                        newLabels[tmp--] = WavWindowLabel.SPEECH;
                    }
                }
                state = STATE.SIGNAL;
            }
        }
        return newLabels;
    }

    private flattenDown(maxDistance: number): WavWindowLabel[] {
        enum STATE {
            NOISE, MAYBE_SIGNAL
        };

        let state = STATE.NOISE;
        let signalLen = 0;

        const newLabels = [...this._labels];

        for (let i = 0; i < newLabels.length; i++) {
            if (state == STATE.NOISE) {
                if (newLabels[i] == WavWindowLabel.SPEECH) {
                    signalLen = 1;
                    state = STATE.MAYBE_SIGNAL;
                }
            } else {
                if (newLabels[i] == WavWindowLabel.SPEECH) {
                    signalLen++;
                    continue;
                }

                if (signalLen < maxDistance) {
                    let tmp = i;
                    tmp--;
                    for (let x = 0; x < signalLen; x++) {
                        newLabels[tmp--] = WavWindowLabel.NOISE;
                    }
                }
                state = STATE.NOISE;
            }
        }
        return newLabels;
    }

    public calculateWords(): WordInfo[] {
        const words: WordInfo[] = [];

        const regex = new RegExp('1+', 'g');
        const labelsStr = this._labels.join('');
        const matches = labelsStr.matchAll(regex);

        for (const match of matches) {
            const wordInfo = {
                startWindowIndex: match.index,
                windowsCount: match[0].length,
            } as WordInfo;
            wordInfo.startTimeMs = wordInfo.startWindowIndex * this._windowSize;
            wordInfo.lengthMs = wordInfo.windowsCount * this._windowSize;
            wordInfo.startSample = wordInfo.startWindowIndex * this._windowSamplesCount;
            wordInfo.samplesCount = wordInfo.windowsCount * this._windowSamplesCount;
            words.push(wordInfo);
        }

        return words;
    }


    public get labels(): WavWindowLabel[] {
        return this._labels;
    }


}