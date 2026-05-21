export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map = new Map<string, AudioContext>();

export const audioContext = (() => {
  let didInteract: Promise<void> | null = null;

  function ensureUserGesture(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }
    if (!didInteract) {
      didInteract = new Promise<void>((resolve) => {
        const unlock = () => resolve();
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
      });
    }
    return didInteract;
  }

  return async (options?: GetAudioContextOptions) => {
    if (typeof window === "undefined") {
      throw new Error("AudioContext is only available in the browser");
    }
    try {
      const a = new Audio();
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } catch {
      await ensureUserGesture();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    }
  };
})();

export function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
