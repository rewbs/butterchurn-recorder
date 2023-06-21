import { A } from "solid-start";

import { unstable_clientOnly } from 'solid-start';

const Butterchurn = unstable_clientOnly(() => import("~/components/Butterchurn"));

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4 flex flex-col items-center">
      <h1 class="max-5-xs text-3xl text-sky-700 uppercase my-4">
        Butterchurn Recorder
      </h1>
      <Butterchurn />
      <div class="mt-8 w-80 text-xs">
        <p>
          This is a wrapper around <A href="https://butterchurnviz.com/" class="text-sky-600 hover:underline">Butterchurn</A>&nbsp;
          (a wonderful Javascript implementation of the venerable <A href="http://www.geisswerks.com/about_milkdrop.html" class="text-sky-600 hover:underline">Milkdrop2</A>),&nbsp;
          modified to allow you to record and download audio visualisation videos.
        </p>
        <br />
        <p>
          It was built as a means to generate interesting input videos for use with <A href="https://github.com/rewbs/sd-parseq" class="text-sky-600 hover:underline">Parseq</A>, for AI enhancement.
        </p>
        <br />
        <p>
          Code is here on Github.
        </p>
      </div>
    </main>
  );
}
