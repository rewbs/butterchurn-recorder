import solid from "solid-start/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
//@ts-ignore
import fs from 'fs';

export default defineConfig({
  plugins: [
    solid({
      //adapter: vercel({edge:false}),
    }),
    nodePolyfills(),
    {
      name: 'generate-json-file',
      generateBundle() {
        const AUDIO_PATH = 'public/audio';
        const files : string[] = fs.readdirSync(AUDIO_PATH);
        var collator = new Intl.Collator([], {numeric: true});
        const filenames = files.sort((a, b) => collator.compare(a, b))
        fs.writeFileSync('public/audioFiles.json', JSON.stringify(filenames));
    }    
  },
  ],
  ssr: {
//    external: ['fs']
  },  
})