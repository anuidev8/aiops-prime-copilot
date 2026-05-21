import EventEmitter from "eventemitter3";
import { createWorketFromSrc } from "@/features/voice-live/lib/audioworklet-registry";
import { audioContext } from "@/features/voice-live/lib/utils";
import AudioRecordingWorklet from "@/features/voice-live/lib/worklets/audio-processing";
import VolMeterWorket from "@/features/voice-live/lib/worklets/vol-meter";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Could not request user media");
    }
    this.starting = new Promise<void>(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);
        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(this.audioContext, workletName);

        this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
          const arrayBuffer = ev.data?.data?.int16arrayBuffer as ArrayBuffer | undefined;
          if (arrayBuffer) {
            this.emit("data", arrayBufferToBase64(arrayBuffer));
          }
        };
        this.source.connect(this.recordingWorklet);

        const vuWorkletName = "vu-meter";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket),
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume as number);
        };
        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        this.starting = null;
      }
    });
    await this.starting;
  }

  stop() {
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };
    if (this.starting) {
      void this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
