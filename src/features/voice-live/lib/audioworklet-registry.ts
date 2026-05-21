export type WorkletGraph = {
  node?: AudioWorkletNode;
  handlers: Array<(this: MessagePort, ev: MessageEvent) => void>;
};

export const registeredWorklets = new Map<
  AudioContext,
  Record<string, WorkletGraph>
>();

export const createWorketFromSrc = (workletName: string, workletSrc: string) => {
  const script = new Blob([`registerProcessor("${workletName}", ${workletSrc})`], {
    type: "application/javascript",
  });
  return URL.createObjectURL(script);
};
