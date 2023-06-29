import { Select, createOptions } from "@thisbeyond/solid-select";
import "@thisbeyond/solid-select/style.css";
import { useRouteData } from "solid-start";

type ExampleAudioListProps = {
   onChange: (e: Event) => void,
}

export default function ExampleAudioList({ onChange } : ExampleAudioListProps) {
    const filenames = useRouteData<any>();
    return <Select
            onChange={ onChange }
            placeholder = 'Select an audio file...'
            {...createOptions(filenames || []) }
        />;
}