export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  multiHandLandmarks?: NormalizedLandmark[][];
}

export interface FaceResults {
  multiFaceLandmarks?: NormalizedLandmark[][];
}

interface MediapipeCamera {
  new (
    video: HTMLVideoElement,
    options: {
      onFrame: () => Promise<void>;
      width: number;
      height: number;
    },
  ): { start: () => void; stop: () => void };
}

interface MediapipeHands {
  new (config: { locateFile: (file: string) => string }): {
    setOptions: (options: Record<string, unknown>) => void;
    onResults: (callback: (results: HandResults) => void) => void;
    send: (input: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
  };
}

interface MediapipeFaceMesh {
  new (config: { locateFile: (file: string) => string }): {
    setOptions: (options: Record<string, unknown>) => void;
    onResults: (callback: (results: FaceResults) => void) => void;
    send: (input: { image: HTMLVideoElement }) => Promise<void>;
    close: () => void;
  };
}

interface MediapipeWindow extends Window {
  Hands?: MediapipeHands;
  FaceMesh?: MediapipeFaceMesh;
  Camera?: MediapipeCamera;
}

const SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
] as const;

let loadPromise: Promise<{
  Hands: MediapipeHands;
  FaceMesh: MediapipeFaceMesh;
  Camera: MediapipeCamera;
}> | null = null;

function loadScript(src: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("MediaPipe requires a browser environment"));
  }

  const existing = document.querySelector(`script[data-mediapipe-src="${src}"]`);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.mediapipeSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load MediaPipe script: ${src}`));
    document.head.appendChild(script);
  });
}

export function loadMediapipeRuntime(): Promise<{
  Hands: MediapipeHands;
  FaceMesh: MediapipeFaceMesh;
  Camera: MediapipeCamera;
}> {
  if (!loadPromise) {
    loadPromise = (async () => {
      for (const url of SCRIPT_URLS) {
        await loadScript(url);
      }

      const win = window as MediapipeWindow;
      if (!win.Hands || !win.FaceMesh || !win.Camera) {
        throw new Error("MediaPipe globals were not registered on window");
      }

      return {
        Hands: win.Hands,
        FaceMesh: win.FaceMesh,
        Camera: win.Camera,
      };
    })();
  }

  return loadPromise;
}
