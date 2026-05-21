"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Webcam from "react-webcam";
import {
  detectPinchClick,
  isPinchGrab,
  landmarkToScreen,
  type HandGestureState,
  type ScreenPoint,
} from "@/features/vision-control/lib/hand-gestures";
import {
  loadMediapipeRuntime,
  type FaceResults,
  type HandResults,
} from "@/features/vision-control/lib/mediapipe-script-loader";

const INITIAL_GESTURE: HandGestureState = {
  handPos: null,
  facePos: null,
  isGrabbing: false,
  isClicking: false,
};

export function useMediapipeVision(enabled: boolean) {
  const webcamRef = useRef<Webcam | null>(null);
  const lastGrabbingRef = useRef(false);
  const [gesture, setGesture] = useState<HandGestureState>(INITIAL_GESTURE);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const onHandResults = useCallback((results: HandResults) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let handPos: ScreenPoint | null = null;
    let isGrabbing = false;
    let isClicking = false;

    if (results.multiHandLandmarks?.length) {
      const landmarks = results.multiHandLandmarks[0];
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      handPos = landmarkToScreen(indexTip.x, indexTip.y, width, height);
      isGrabbing = isPinchGrab(
        thumbTip.x,
        thumbTip.y,
        indexTip.x,
        indexTip.y,
      );
      isClicking = detectPinchClick(isGrabbing, lastGrabbingRef.current);
      lastGrabbingRef.current = isGrabbing;
    } else {
      lastGrabbingRef.current = false;
    }

    setGesture((prev) => ({
      ...prev,
      handPos,
      isGrabbing,
      isClicking,
    }));
  }, []);

  const onFaceResults = useCallback((results: FaceResults) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let facePos: ScreenPoint | null = null;

    if (results.multiFaceLandmarks?.length) {
      const nose = results.multiFaceLandmarks[0][1];
      facePos = landmarkToScreen(nose.x, nose.y, width, height);
    }

    setGesture((prev) => ({ ...prev, facePos }));
  }, []);

  const startPipeline = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || !enabled) return undefined;

    try {
      const { Hands, FaceMesh, Camera } = await loadMediapipeRuntime();

      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onHandResults);
      faceMesh.onResults(onFaceResults);

      const camera = new Camera(video, {
        onFrame: async () => {
          if (!webcamRef.current?.video) return;
          await hands.send({ image: webcamRef.current.video });
          await faceMesh.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });

      camera.start();
      setCameraReady(true);
      setCameraError(null);

      return () => {
        camera.stop();
        hands.close();
        faceMesh.close();
        setCameraReady(false);
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start hand tracking";
      setCameraError(message);
      setCameraReady(false);
      return undefined;
    }
  }, [enabled, onFaceResults, onHandResults]);

  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      setGesture(INITIAL_GESTURE);
      setCameraReady(false);
      return undefined;
    }

    let cancelled = false;

    void startPipeline().then((cleanup) => {
      if (cancelled) {
        cleanup?.();
        return;
      }
      cleanupRef.current = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = undefined;
    };
  }, [enabled, startPipeline]);

  const handleUserMedia = useCallback(() => {
    void startPipeline().then((cleanup) => {
      cleanupRef.current?.();
      cleanupRef.current = cleanup;
    });
  }, [startPipeline]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    const message =
      typeof error === "string"
        ? error
        : error.message || "Camera permission denied";
    setCameraError(message);
    setCameraReady(false);
  }, []);

  return {
    webcamRef,
    gesture,
    cameraReady,
    cameraError,
    handleUserMedia,
    handleUserMediaError,
  };
}
