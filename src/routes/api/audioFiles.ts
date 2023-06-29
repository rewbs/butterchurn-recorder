//@ts-expect-error
import fs from 'fs';
import { json } from "solid-start";

const AUDIO_PATH = 'public/audio';

export function rawFilenames() {
    const files : string[] = fs.readdirSync(AUDIO_PATH);
    var collator = new Intl.Collator([], {numeric: true});
    const filenames = files.sort((a, b) => collator.compare(a, b))
    return filenames;
}    

export function GET() {
    return json(rawFilenames());
}