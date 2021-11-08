import { promisify } from 'util';
import { WavEndpointing } from './lib/endpointing';
import { WavFFT } from './lib/fft';
import { calcuateNoise } from './lib/noise';
import { loadWavFromFile } from './lib/wav';

import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
const readdirAsync = promisify(fs.readdir);


//CONFIG_VARIABLES
process.env.PORT = process.env.PORT ? process.env.PORT : '3000';
process.env.HOST = process.env.HOST ? process.env.HOST : '127.0.0.1';
process.env.APP_ENV = process.env.APP_ENV ? process.env.APP_ENV : 'DEV';
//CONFIG_VARIABLES_END

//APP
const app: Express = express();
//APP_END

//APP_BODY
app.use(express.json());
app.use(express.urlencoded());
//APP_BODY_END

//ROUTES

const dataPath = path.join(__dirname, '..', 'data');

app.get('/data', async (req: Request, res: Response) => {
    const data = (await readdirAsync(dataPath)).filter(x => x.toLowerCase().endsWith('.wav'));
    return res.json(data);
});

app.get('/noise', async (req: Request, res: Response) => {
    const fileName = req.query.fileName.toString();
    const noiseLength = req.query.noiseLength.toString();

    const wav = await loadWavFromFile(`${dataPath}/${fileName}`);
    const noiseLevel = calcuateNoise(wav, noiseLength);

    return res.json({
        noiseLevel: noiseLevel
    });
});

app.get('/endpointing', async (req: Request, res: Response) => {
    const fileName = req.query.fileName.toString();
    const windowSize = req.query.windowSize.toString();
    const noiseLevel = parseFloat(req.query.noiseLevel.toString());
    const p = parseInt(req.query.p.toString());
    const q = parseInt(req.query.q.toString());

    const wav = await loadWavFromFile(`${dataPath}/${fileName}`);
    let endpointig = new WavEndpointing(wav, windowSize, noiseLevel, p, q);

    return res.json(endpointig.calculateWords());
});

app.get('/signal', async (req: Request, res: Response) => {
    const fileName = req.query.fileName.toString();
    const wav = await loadWavFromFile(`${dataPath}/${fileName}`);

    return res.json(wav.samples);
});

app.get('/fft', async (req: Request, res: Response) => {
    const fileName = req.query.fileName.toString();
    const windowSize = req.query.windowSize.toString();
    const windowFunctionType = parseInt(req.query.windowFunction.toString());
    const windowIndex = parseInt(req.query.windowIndex.toString());

    const wav = await loadWavFromFile(`${dataPath}/${fileName}`);
    const fft = new WavFFT(wav);

    const result = fft.fft(windowSize, windowFunctionType, windowIndex);

    const keys = [];
    const vals = [];

    for (const key of result.keys()) {
        if (key == 0) continue;
        keys.push(key);
        vals.push(result.get(key));
    }

    return res.json([keys, vals]);
});

app.get('/sonogram', async (req: Request, res: Response) => {
    const fileName = req.query.fileName.toString();
    const windowSize = req.query.windowSize.toString();
    const windowFunctionType = parseInt(req.query.windowFunction.toString());

    const wav = await loadWavFromFile(`${dataPath}/${fileName}`);
    const fft = new WavFFT(wav);

    const result = fft.sonogram(windowSize, windowFunctionType);

    let sonogram = [];
    for (const r of result) {
        const keys = [];
        const vals = [];
        for (const key of r.keys()) {
            if (key == 0) continue;
            keys.push(key);
            vals.push(r.get(key));
        }
        sonogram.push([keys, vals]);
    }

    return res.json(sonogram);
});
//END_ROUTES

app.use('/', express.static(path.join(__dirname, '..', 'public')));

//404_ERROR
app.get('*', (req: Request, res: Response) => {
    return res.status(404).json({});
});
//404_ERROR_END

const server = app.listen(parseInt(process.env.PORT), process.env.HOST, () => {
    console.log(`[+] Server started at http://${process.env.HOST}:${process.env.PORT}`);
});