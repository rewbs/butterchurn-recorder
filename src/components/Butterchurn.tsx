//@ts-expect-error
import butterchurn from 'butterchurn';
//@ts-expect-error
import butterchurnPresets from 'butterchurn-presets';
import { createMemo, createSignal, onMount } from 'solid-js';
import { Select, SingleValue, Input, SelectContext, createOptions } from "@thisbeyond/solid-select";
import "@thisbeyond/solid-select/style.css";
import { ACRecorder, ACRecorderOptions } from './audio-recorder';

// TODO - figure out the right Tailwind-esque way to do this.
const tw_btn_disabled = "text-gray-300  bg-gray-100 text-xs border border-grey-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-grey-500 dark:text-grey-500"
const tw_btn = "text-blue-700 text-xs hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"


export default function Butterchurn() {

    let canvas: HTMLCanvasElement;
    let video: HTMLVideoElement;
    let delayedAudible: any = null;
    let audioContext = new AudioContext();
    let visualizer: any = null;
    let audioVideoRecoder : ACRecorder | null = null;
    const [audioFile, setAudioFile] = createSignal<Blob | null>();
    const [isRecording, setIsRecording] = createSignal(false);
    const [recordingAvailable, setRecordingAvailable] = createSignal(false);
    const [recordingStartTime, setRecordingStartTime] = createSignal(0);
    const [timerString, setTimerString] = createSignal("0.00s");

    const recoderOptions : ACRecorderOptions = {
        fps: 60,
        audioBitsPerSecond: 196000,
        videoBitsPerSecond: 30000000,
        mimeType: MediaRecorder.isTypeSupported("video/mp4;codecs=h264,vp9,opus") ? "video/mp4;codecs=h264,vp9,opus"
                    : MediaRecorder.isTypeSupported("video/webm;codecs=h264,vp9,opus") ? "video/webm;codecs=h264,vp9,opus"
                    : MediaRecorder.isTypeSupported("video/mp4;codecs=h264") ? "video/mp4;codecs=h264"
                    : MediaRecorder.isTypeSupported("video/webm;codecs=h264") ? "video/webm;codecs=h264"
                    : MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4"
                    : "video/webm",
        saveType: MediaRecorder.isTypeSupported("video/mp4") ? "mp4" : "webm", 
    };

    const handleFileChange = (event: any) => {
        setAudioFile(event.target.files[0]);
    };

    function startRenderer(): void {
        visualizer.render();
        requestAnimationFrame(() => {
            startRenderer();
        });
    }

    onMount(async () => {
        audioContext.resume();
        visualizer = butterchurn.createVisualizer(audioContext, canvas, {
            width: 512,
            height: 512
        });
        const presets = butterchurnPresets.getPresets();
        const preset = presets['Flexi, martin + geiss - dedicated to the sherwin maxawow'];
        visualizer.setRendererSize(512, 512);
        visualizer.loadPreset(preset, 0.0);
        startRenderer();
        setInterval(updateTimer, 100);
    });

    function updateTimer() {
        if (!isRecording()) {
            return;
        }
        setTimerString(((Date.now() - recordingStartTime()) / 1000).toFixed(2) + 's');
    };

    const start = () => {
        audioContext.resume();

        const sourceNode = audioContext.createBufferSource();
        audioVideoRecoder = new ACRecorder(sourceNode, "#canvas", audioContext);
        console.log("using options:", recoderOptions);
        audioVideoRecoder.setOptions(recoderOptions);

        setRecordingStartTime(Date.now());
        setIsRecording(true);

        // Kick off audio playback and visualiser
        var reader = new FileReader();
        reader.onload = (event) => {
            if (!event?.target?.result) {
                return;
            }
            //@ts-expect-error
            audioContext.decodeAudioData(event.target.result, (buffer) => {
                if (delayedAudible) {
                    delayedAudible.disconnect();
                }
                sourceNode.buffer = buffer;

                // Introduce small delay on audio (TODO: why?) and connect to output
                delayedAudible = audioContext.createDelay();
                delayedAudible.delayTime.value = 0.26;
                sourceNode.connect(delayedAudible)
                delayedAudible.connect(audioContext.destination);

                // Connect audio to the visualiser
                visualizer.connectAudio(delayedAudible); // TODO why using delayedAudible? 

                // Start audio playback
                sourceNode.start(0);

                // Start recording
                audioVideoRecoder?.start();
            }
            );
        };
        if (audioFile()) {
            reader.readAsArrayBuffer(audioFile() as Blob);
        }
    }

    const stop = () => {
        setIsRecording(false);
        audioVideoRecoder?.stop();
        delayedAudible?.disconnect();        
        setTimeout(async () => {
            audioVideoRecoder?.preview("", document.querySelector("#video") as HTMLVideoElement).then(() => {
                setRecordingAvailable(true);
            }).catch((e) => {
                setRecordingAvailable(false);
                console.error("Could not initialize preview - problem with recording?", e);
            });
        });
    }

    const presetList = createMemo(() => {
        const props = createOptions(Object.keys(butterchurnPresets.getPresets()));
        return <Select
            onChange={(e) => { console.log(e); visualizer.loadPreset(butterchurnPresets.getPresets()[e], 0.0); }}
            placeholder='Select a preset...'
            {...props}
        />
    });

    return <>
        <div class="grid grid-cols-3 gap-4 border-y-2 py-2 mb-5 ">
            <div>
                <label class="block mb-2 text-sm font-medium text-red-600 dark:text-white" for="file_input">Pick an audio file</label>
                <input
                    id="file_input"
                    type="file"
                    class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    onChange={handleFileChange}
                    onClick={(e: Event) => ((e.target as HTMLInputElement).value as string | null) = null}
                />
            </div>
            <div class="flex flex-col items-center gap-1">
                <button
                    type="button"
                    disabled={!audioFile()}
                    class={!audioFile() ? tw_btn_disabled : tw_btn}
                    onClick={() => { start() }}
                >
                    Start play & record
                </button>
                <button
                    type="button"
                    disabled={!isRecording()}
                    class={!isRecording() ? tw_btn_disabled : tw_btn}
                    onClick={() => { stop() }}
                >
                    Stop
                </button>
            </div>
            <div class="flex flex-col items-center">
                Recording time:
                <span id="timer" class="font-bold">{timerString()}</span>
            </div>
        </div>
        <hr/>
        <div class="flex flex-col lg:flex-row">
            <div class="flex flex-col max-w-screen-sm" >
                <canvas ref={canvas!} id='canvas' width='512' height='512' />                
                <div class="w-full text-left">
                    Preset:&nbsp;
                    <style>{`
                        .solid-select-list {
                            background-color: white !important ;
                        }
                    `}</style>
                    {presetList()}
                </div>
            </div>
            <div class="flex flex-col max-w-screen-sm justify-items-center items-center">
                <div style="min-height: 512px">
                    <video height={512} width={512} ref={video!} id="video" controls />
                </div>                
                <div>
                    <p>Your video will appear here ↑ when the recording is stopped.</p>
                    <button
                    type="button"
                    disabled={!recordingAvailable()}
                    class={!recordingAvailable() ? tw_btn_disabled : tw_btn}
                    onClick={() => { audioVideoRecoder?.download(); }}
                >
                    Download video
                </button>                    
                </div>
                <div class="mx-10 text-left text-xs p-2  text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                    <p>⚠️ The downloaded video may fail to open in some tools. To remedy this, re-save it with ffmpeg, e.g.:
                        <br/><code>ffmpeg -i in.mp4 -vcodec libx264 -crf 20 out.mp4</code>.</p>
                </div>

 
            </div>
        </div>
    </>;

}


