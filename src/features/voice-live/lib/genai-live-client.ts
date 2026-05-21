import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";
import EventEmitter from "eventemitter3";
import type { LiveClientOptions, StreamingLog } from "@/features/voice-live/types";
import { base64ToArrayBuffer } from "@/features/voice-live/lib/utils";

export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: { modelTurn: Content }) => void;
  error: (error: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (toolcallCancellation: LiveServerToolCallCancellation) => void;
  turncomplete: () => void;
  inputtranscription: (text: string, finished: boolean) => void;
}

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  constructor(options: LiveClientOptions) {
    super();
    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    this.emit("log", { date: new Date(), type, message });
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    this._status = "connecting";
    this.config = config;
    this._model = model;

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      this.emit("error", new ErrorEvent("error", { message }));
      return false;
    }

    this._status = "connected";
    this.emit("open");
    return true;
  }

  disconnect() {
    if (!this.session) {
      return false;
    }
    this.session.close();
    this._session = null;
    this._status = "disconnected";
    this.log("client.close", "Disconnected");
    return true;
  }

  protected onopen() {
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    this.log("server.error", e.message);
    this.emit("error", e);
  }

  protected onclose(e: CloseEvent) {
    this._status = "disconnected";
    this._session = null;
    this.log(
      "server.close",
      `disconnected code=${e.code} ${e.reason ? `reason: ${e.reason}` : ""}`,
    );
    this.emit("close", e);
  }

  protected async onmessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    if (!message.serverContent) {
      return;
    }

    const { serverContent } = message;
    this.handleServerContent(serverContent);
  }

  private handleServerContent(serverContent: LiveServerContent) {
    if (serverContent.interrupted) {
      this.log("server.content", "interrupted");
      this.emit("interrupted");
      return;
    }

    if (serverContent.inputTranscription?.text) {
      this.emit(
        "inputtranscription",
        serverContent.inputTranscription.text,
        Boolean(serverContent.inputTranscription.finished),
      );
    }

    if (serverContent.turnComplete) {
      this.log("server.content", "turnComplete");
      this.emit("turncomplete");
    }

    if (!serverContent.modelTurn?.parts?.length) {
      return;
    }

    const parts = serverContent.modelTurn.parts;
    const audioParts = parts.filter((part) =>
      part.inlineData?.mimeType?.startsWith("audio/"),
    );
    const otherParts = parts.filter((part) => !audioParts.includes(part));

    for (const part of audioParts) {
      const b64 = part.inlineData?.data;
      if (b64) {
        const data = base64ToArrayBuffer(b64);
        this.emit("audio", data);
        this.log("server.audio", `buffer (${data.byteLength})`);
      }
    }

    if (otherParts.length) {
      this.emit("content", { modelTurn: { parts: otherParts } });
      this.log("server.content", { modelTurn: { parts: otherParts } });
    }
  }

  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== "connected" || !this.session) {
      return;
    }

    for (const chunk of chunks) {
      const mimeType = chunk.mimeType.toLowerCase();
      try {
        // `media` maps to `mediaChunks` in SDK internals and gets rejected (1007) by current Live API.
        if (mimeType.startsWith("audio/")) {
          this.session.sendRealtimeInput({ audio: chunk });
          continue;
        }
        if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
          this.session.sendRealtimeInput({ video: chunk });
          continue;
        }
        this.log("client.realtimeInput.skip", `Unsupported mime type: ${chunk.mimeType}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log("client.realtimeInput.error", message);
        break;
      }
    }
    const hasAudio = chunks.some((chunk) => chunk.mimeType.includes("audio"));
    const hasVideo = chunks.some(
      (chunk) => chunk.mimeType.includes("image") || chunk.mimeType.includes("video"),
    );
    const message = hasAudio && hasVideo ? "audio + video" : hasAudio ? "audio" : hasVideo ? "video" : "unknown";
    this.log("client.realtimeInput", message);
  }

  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (toolResponse.functionResponses?.length) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log("client.toolResponse", toolResponse);
    }
  }

  /**
   * Official pattern: session.sendClientContent({ turns: ["text"] }).
   * Also accepts Part objects for advanced use.
   */
  send(turn: Part | Part[] | string, turnComplete = true) {
    const turns = typeof turn === "string" ? [turn] : Array.isArray(turn) ? turn : [turn];
    this.session?.sendClientContent({ turns, turnComplete });
    this.log("client.send", { turns, turnComplete });
  }
}
