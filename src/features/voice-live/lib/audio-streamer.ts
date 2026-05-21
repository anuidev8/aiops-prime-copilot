import {
  createWorketFromSrc,
  registeredWorklets,
} from "@/features/voice-live/lib/audioworklet-registry";

export class AudioStreamer {
  private sampleRate = 24000;
  private bufferSize = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private isStreamComplete = false;
  private checkInterval: number | null = null;
  private scheduledTime = 0;
  private initialBufferTime = 0.1;
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;

  public onComplete = () => {};

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  async addWorklet<T extends (this: MessagePort, ev: MessageEvent) => void>(
    workletName: string,
    workletSrc: string,
    handler: T,
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord?.[workletName]) {
      workletsRecord[workletName].handlers.push(handler);
      return this;
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context)!;
    }

    workletsRecord[workletName] = { handlers: [handler] };
    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    workletsRecord[workletName].node = new AudioWorkletNode(this.context, workletName);
    return this;
  }

  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);
    for (let i = 0; i < chunk.length / 2; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32Array[i] = int16 / 32768;
    }
    return float32Array;
  }

  addPCM16(chunk: Uint8Array) {
    this.isStreamComplete = false;
    let processingBuffer = this._processPCM16Chunk(chunk);
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }
    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer() {
    const scheduleAheadTime = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + scheduleAheadTime
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = source;
        source.onended = () => {
          if (!this.audioQueue.length && this.endOfQueueAudioSource === source) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        };
      }

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);
      if (worklets) {
        for (const [, graph] of Object.entries(worklets)) {
          const { node, handlers } = graph;
          if (node) {
            source.connect(node);
            node.port.onmessage = function (ev: MessageEvent) {
              for (const handler of handlers) {
                handler.call(node.port, ev);
              }
            };
            node.connect(this.context.destination);
          }
        }
      }

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);
      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else if (!this.checkInterval) {
        this.checkInterval = window.setInterval(() => {
          if (this.audioQueue.length > 0) {
            this.scheduleNextBuffer();
          }
        }, 100);
      }
    } else {
      const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(() => this.scheduleNextBuffer(), Math.max(0, nextCheckTime - 50));
    }
  }

  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  complete() {
    this.isStreamComplete = true;
    this.onComplete();
  }
}
