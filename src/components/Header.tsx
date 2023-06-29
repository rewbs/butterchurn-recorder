//@ts-expect-error
import butterchurn from 'butterchurn';
//@ts-expect-error
import butterchurnPresets from 'butterchurn-presets';
import { Select, createOptions } from "@thisbeyond/solid-select";
import { createMemo, createSignal, onMount } from 'solid-js';
import ExampleAudioList from './ExampleAudioList';
import { ACRecorder, ACRecorderOptions } from './audio-recorder';
import "@thisbeyond/solid-select/style.css";
import Fa from 'solid-fa';
import { faGithub, faPatreon } from '@fortawesome/free-brands-svg-icons'
import { faCoffee, faRocket } from '@fortawesome/free-solid-svg-icons'

// TODO - figure out the right Tailwind-esque way to do this.
const badgestyle = "text-white bg-[#24292F] hover:bg-[#24292F]/90 focus:ring-4 focus:outline-none focus:ring-[#24292F]/50 font-small rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500 dark:hover:bg-[#050708]/30 mr-2 mb-2"

export default function Header() {

    return <div class="flex pt-1 px-1 justify-around">
        <div class="flex align-middle gap-1">
            <a href="https://sd-parseq.web.app"><div class={badgestyle}>
                <Fa size="lg" color='green' icon={faRocket} class="mr-2" />
                Parseq
            </div></a>  
        </div>
        <div class="flex align-middle gap-1">
            <a href="https://github.com/rewbs/butterchurn-recorder"><div class={badgestyle}>
                <Fa size="lg" icon={faGithub} class="mr-2" />
                Code on Github
            </div></a>
            <a href="https://www.buymeacoffee.com/rewbs"><div class={badgestyle}>
                <Fa size="lg" color='#C4A484'  icon={faCoffee} class="mr-2" />
                Buy me a coffee
            </div></a>       
            <a href="https://www.patreon.com/rewbs"><div  class={badgestyle}>
                <Fa size="lg" color='#f1465a' icon={faPatreon} class="mr-2" />
                Support on Patreon
            </div></a>
        </div>
    </div>
}

