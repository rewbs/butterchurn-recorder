/**
 * Adapted from https://github.com/Moveharder/ac-recorder
 */

export type ACRecorderOptions = {
    audioControl?: boolean;
    fps?: number;
    mimeType?: string;
    saveType?: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
}

export type ACRecorderCallbacks = {
    start?: () => void;
    fail?: (data: { msg: string, err?: {} }) => void;
    pause?: () => void;
    resume?: () => void;
    stop?: (data : { blobUrl: string, size: number, chunks: BlobPart[] } | { msg: string, err?: {} }) => void;
}

export class ACRecorder {
    options : ACRecorderOptions = {
      audioControl: false,
      fps: 60,
      mimeType: "video/mp4", //chrome - video/webm ; safari - video/mp4;
      saveType: "mp4",
    };
  
    callbacks : ACRecorderCallbacks = {    };
  
    audio? : HTMLAudioElement;
    audioContext? : AudioContext;
    initialSourceNode? : AudioNode;
    sourceNode? : AudioNode;
    audioStream? : MediaStream;
  
    canvas? : HTMLCanvasElement; 
    canvasStream? : MediaStream;
  
    mediaRecorder? : MediaRecorder;
    recordingChunks : BlobPart[] = [];
    mediaUrl? : string; // Data link to the video
    state = 0; // 0-ready 1-recording 2-stoped
  
    constructor(targetAudio : HTMLAudioElement | AudioNode | string, targetCanvas : HTMLCanvasElement | string, audioContext? : AudioContext) {
      if (typeof targetAudio === "string") {
        this.audio = document.querySelector(targetAudio) as HTMLAudioElement;
      } else if ((targetAudio as HTMLAudioElement).src) {
        this.audio = (targetAudio as HTMLAudioElement);
      } else if ((targetAudio as AudioNode).channelCount) {
        this.initialSourceNode = (targetAudio as AudioNode);
      }
  
      if (typeof targetCanvas === "object") {
        this.canvas = targetCanvas;
      } else {
        this.canvas = document.querySelector(targetCanvas) as HTMLCanvasElement;
      }

      if (audioContext) {
        this.audioContext = audioContext;
      }
  
      // Automatically set mimeType according to browser
      this.setOptions();
    }
  


    /**
     * Please call this method after instantiation and before createRecorder.
     * @param {Object} options
     * @param-options.audioControl: false,
     * @param-options.fps: 60,
     * @param-options.mimeType: "video/mp4",
     * @param-options.saveType: "mp4",
     */
    setOptions(options : ACRecorderOptions = {}) {
      if (!options.mimeType) {
        if (MediaRecorder.isTypeSupported("video/webm")) {
          // Chrome
          this.options.mimeType = "video/webm";
          this.options.saveType = "webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          // Safari
          this.options.mimeType = "video/mp4";
          this.options.saveType = "mp4";
        }
      }
      this.options = { ...this.options, ...options };
    }
  
    /**
     * Set media monitoring events to implement personal logic - Promise
     * @param {Object} listeners Recorder monitor callback function { start, pause, resume, stop, fail }
     * @returns - { msg }
     */
    setListeners(listeners = {}) {
      return new Promise((resolve, reject) => {
        if (typeof listeners !== "object") {
          return reject({
            msg: "listeners must be an object like { start, pause, resume, stop, fail }",
          });
        }
        this.callbacks = { ...this.callbacks, ...listeners };
        resolve({ msg: "Successfully set up event monitoring" });
      });
    }
  

    /**
     * Get the audio stream (audio) - Promise
     * !!! Note: new AudioContext() must be executed after a user operation,
     * !!! Otherwise you'll see the following warning: "The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page"
     * https://`de`veloper.mozilla.org/zh-CN/docs/Web/API/AudioContext/createMediaElementSource
     */
    getAudioStream() {
      return new Promise((resolve, reject) => {
        // Check if the browser supports the MediaRecorder API
        if (!window.MediaRecorder) {
          return reject({ msg: "MediaRecorder API is not supported" });
        }
  
        if (this.audioStream) {
          return resolve({ msg: "Using an existing audio stream", stream: this.audioStream });
        }

        try {
          // create audio context if none was supplied.
          if (!this.audioContext) {             
            this.audioContext = new AudioContext();
          }

          if (this.initialSourceNode) {
            // Use supplied source node. Assume node is managed by client so do not connect to main output.
            this.sourceNode = this.initialSourceNode;
          } else {
            // Create a new MediaElementAudioSourceNode object linked to the audio stream, or use supplied source node.
            // Also connect to the main output else audio will be muted during recording
            this.sourceNode = this.audio && this.audioContext.createMediaElementSource(this.audio);
            this.sourceNode?.connect(this.audioContext.destination);
          }
          if (!this.sourceNode) {
            return reject({ msg: "Invalid audio source. You must specify either a valid audio element or a valid input source node." });
          }          

          // Create a WebRTC object associated with the audio stream
          let mediaStreamDestination = this.audioContext.createMediaStreamDestination();

          // Connect createMediaElementSource to createMediaStreamDestination so that the audio stream can be obtained
          this.sourceNode?.connect(mediaStreamDestination);

          // Get the audio stream data
          this.audioStream = mediaStreamDestination.stream;

          resolve({ msg: "Obtained audio stream successfully", stream: this.audioStream });
        } catch (err) {
          reject({ msg: "Failed to get audio stream", err });
        }
      });
    }
  
    /**
     * Get the video stream (canvas)  - Promise
     */
    getCanvasStream() {
      return new Promise((resolve, reject) => {
        if (this.canvasStream) {
          return resolve({ msg: "Using an existing video stream", stream: this.canvasStream, });
        }
        if (!this.canvas) {
          return reject({ msg: "Invalid canvas" });
        }
        try {
          this.canvasStream = this.canvas.captureStream(this.options.fps);
          resolve({ msg: "Obtained the video stream successfully", stream: this.canvasStream });
        } catch (err) {
          reject({ msg: "Failed to get video stream", err });
        }
      });
    }
  
    /**
     * Combine video (canvas) and audio (audio) - Promise
     * https://developer.mozilla.org/zh-CN/docs/Web/API/MediaRecorder
     */
    combinACStream() {
      return new Promise((resolve) => {
        const { start, pause, resume, stop, fail } = this.callbacks;

        if (this.mediaRecorder) {
          return resolve({ mediaRecorder: this.mediaRecorder });
        }
        if (!this.canvasStream || !this.audioStream) {
          fail && fail({ msg: "Canvas stream not initialised"});
          return;
        }
        if (!this.audioStream) {
          fail && fail({ msg: "Audio stream not initialised"});
          return;
        }     
  
        const combinedStream = new MediaStream([
          ...this.canvasStream.getTracks(),
          ...this.audioStream.getTracks(),
        ]);
        this.mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: this.options.mimeType,
          ...(this.options.videoBitsPerSecond ? {videoBitsPerSecond: this.options.videoBitsPerSecond } : {}),
          ...(this.options.audioBitsPerSecond ? {audioBitsPerSecond: this.options.audioBitsPerSecond } : {}),
        });
  
        this.mediaRecorder.onstart = () => {
          start && start();
        };
        this.mediaRecorder.onpause = () => {
          pause && pause();
        };
        this.mediaRecorder.onresume = () => {
          resume && resume();
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordingChunks, {
            type: this.options.mimeType,
          });
          const url = URL.createObjectURL(blob);
          this.mediaUrl = url;
  
          // calculate video size
          let size = this.recordingChunks.reduce((total, curr) => {
            //@ts-expect-error -- TODO - what is the type of curr?
            total += curr.size;
            return total;
          }, 0);
  
          stop && stop({ blobUrl: url, size, chunks: this.recordingChunks });
          this.recordingChunks = [];
        };
        this.mediaRecorder.onerror = (event) => {
          fail &&
            //@ts-expect-error -- TODO - what is the type of event?
            fail({ msg: `# error recording stream: ${event.error.name}`, ...event.error, });
        };
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordingChunks.push(event.data);
          }
        };
  
        return resolve({ mediaRecorder: this.mediaRecorder });
      });
    }
  
    /**
     * Create Media Recorder - Promise
     * @returns - { mimeType, audio, canvas, ... }
     */
    async createRecorder() {
      this.state = 0;
      try {
        await this.getAudioStream();
        await this.getCanvasStream();
        await this.combinACStream();
      } catch (err : any) {
        return Promise.reject({ msg: "Failed to create Media Recorder", ...err });
      }
      return Promise.resolve({
        audio: this.audio,
        audioSourceNode: this.sourceNode,
        audioContext: this.audioContext,
        canvas: this.canvas,
        supportMimeType: this.options.mimeType,
      });
    }
  
    /** Start - Promise */
    start() {
      return new Promise(async (resolve, reject) => {
        if (![0, 2].includes(this.state)) {
          return reject({ msg: "Could not start. Please stop recording first." });
        }

        // !!! this.createRecorder() method must be executed after a user operation because, else new AudioContext() will fail.
        let res = await this.createRecorder();
        if (!this.mediaRecorder) {
          return reject({ msg: "MediaRecorder creation failed." });
        }

        this.mediaRecorder.start();
        this.controlAudio("play");
        this.state = 1;
        delete this.mediaUrl;
  
        resolve({ msg: "# recorder started", ...res });
      });
    }
  
    /** Pause - Promise */
    pause() {
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          return reject({ msg: "MediaRecorder not initialised" });
        }

        if (this.mediaRecorder.state === "recording") {
          this.mediaRecorder.pause();
          this.controlAudio("pause");
          resolve({ msg: "# recorder paused" });
        } else {
          reject({ msg: `Could not pause. The current state of the recorder is: ${this.mediaRecorder.state}` });
        }
      });
    }
  
    /** Resume - Promise */
    resume() {
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          return reject({ msg: "MediaRecorder not initialised" });
        }

        if (this.mediaRecorder.state === "paused") {
          this.mediaRecorder.resume();
          this.controlAudio("play");
          resolve({ msg: "# resume recording" });
        } else {
          reject({ msg: `Could not resume. The current state of the recorder is: ${this.mediaRecorder.state}` });
        }
      });
    }
  
    /** Stop - Promise */
    stop() {
      return new Promise((resolve, reject) => {
        if (this.state != 1) {
          return reject({ msg: "Could not stop. Please start recording first." });
        }
        if (!this.mediaRecorder) {
          return reject({ msg: "MediaRecorder not initialised" });
        }        
  
        this.mediaRecorder.stop();
        this.controlAudio("pause");
        this.state = 2;
  
        resolve({ msg: "# recorder stoped" });
      });
    }
  
    /**
     * Preview video - Promise
     * @param {String} cssText Customize the css style of the preview video
     * @param {HTMLVideoElement} videoElement Optionally specify an existing video element to use 
     * @returns
     */
    preview(cssText? : string, videoElement? : HTMLVideoElement) {
      return new Promise((resolve, reject) => {
        if (this.state != 2) {
          return reject({ msg: "Please stop recording first" });
        }
        if (!this.mediaUrl) {
          return reject({ msg: "No video to preview" });
        }
  
        let video;
        if (!videoElement) {
          // Create a new Video element
          video = document.createElement("video");
          video.id = "ac_preview_video";
          video.style.cssText =
            cssText ||
            `
              z-index:20000;
              position:absolute;
              width: 80%;
              top:50%;
              left:50%;
              transform:translateX(-50%) translateY(-50%);
              border-radius: 16px;
          `;  
          video.controls = true;
          video.autoplay = true;
          document.body.appendChild(video); // Add the Video element to the DOM
        } else {
          // Use existing Video element
          video = videoElement;
        }
  
        // Point the video element to the recorded blob
        video.src = this.mediaUrl;
  
        resolve({ msg: "Video preview is on" });
      });
    }
  
    /** Close preview */
    closePreview() {
      let previewEl = document.querySelector("#ac_preview_video");
      if (previewEl) {
        document.body.removeChild(previewEl);
      }
    }
  
    /** Download */
    download() {
      // TODO - don't use alert()
      if (this.state != 2) {
        alert("Please stop recording first");
        return;
      }
      if (!this.mediaUrl) {
        return alert("No video to download");
      }
      
      const a = document.createElement("a");
      a.href = this.mediaUrl;
      a.download = `output.${this.options.saveType}`;
      a.click();
    }
  
    /**（internal) play/pause control */
    controlAudio(type : "play" | "pause") {
      if (!this.options.audioControl) {
        return;
      }
      if (!this.audio) {
        console.warn("Cannot control audio when constructed with a source node.")
        return;
      }
      if (type == "play") {
        this.audio.play();
        return;
      }
      if (type == "pause") {
        this.audio.pause();
        return;
      }
    }
  
    /** Switch music source */
    changeAudio(src : string) {
      if (!this.audio) {
        console.warn("Cannot switch audio audio when constructed with a source node.")
        return;
      }
      this.controlAudio("pause");
      this.audio.src = src;
      this.controlAudio("play");
    }
  
    destroy() {
      this.audioContext?.close();
      delete this.audio;
      delete this.initialSourceNode;
      delete this.audioContext;
      delete this.canvas;
      delete this.canvasStream;
      this.recordingChunks = [];
    }
  }