import { Select, createOptions } from "@thisbeyond/solid-select";
import "@thisbeyond/solid-select/style.css";
import { useRouteData } from "solid-start";
import { rawFilenames } from '../routes/api/audioFiles'
import audioFiles from '../../public/audioFiles.json'

type ExampleAudioListProps = {
   onChange: (e: Event) => void,
}

export default function ExampleAudioList({ onChange } : ExampleAudioListProps) {
    return <Select
            onChange={ onChange }
            placeholder = 'Select an audio file...'
            {...createOptions(audioFiles) }
        />;
}