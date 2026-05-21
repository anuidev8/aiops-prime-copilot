"use client";

import { motion, useSpring } from "framer-motion";
import { Target } from "lucide-react";
import { useEffect } from "react";
import type { HandGestureState } from "@/features/vision-control/lib/hand-gestures";

interface VisionHandCursorProps {
  gesture: HandGestureState;
  visible: boolean;
}

export function VisionHandCursor({ gesture, visible }: VisionHandCursorProps) {
  const handX = useSpring(0, { damping: 22, stiffness: 180 });
  const handY = useSpring(0, { damping: 22, stiffness: 180 });
  const faceX = useSpring(0, { damping: 28, stiffness: 120 });
  const faceY = useSpring(0, { damping: 28, stiffness: 120 });

  useEffect(() => {
    if (gesture.handPos) {
      handX.set(gesture.handPos.x);
      handY.set(gesture.handPos.y);
    }
  }, [gesture.handPos, handX, handY]);

  useEffect(() => {
    if (gesture.facePos) {
      faceX.set(gesture.facePos.x);
      faceY.set(gesture.facePos.y);
    }
  }, [gesture.facePos, faceX, faceY]);

  if (!visible || !gesture.handPos) {
    return null;
  }

  return (
    <>
      {gesture.facePos ? (
        <motion.div
          className="pointer-events-none fixed z-[60] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/80 shadow-[0_0_12px_rgba(125,211,252,0.9)]"
          style={{ x: faceX, y: faceY }}
        />
      ) : null}
      <motion.div
        className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-1/2"
        style={{ x: handX, y: handY }}
      >
        <div
          className={[
            "grid h-12 w-12 place-items-center rounded-full border-2 transition-colors",
            gesture.isGrabbing
              ? "border-lime-300 bg-lime-400/25 text-lime-200 shadow-[0_0_24px_rgba(190,242,100,0.55)]"
              : "border-cyan-300/80 bg-cyan-500/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.45)]",
          ].join(" ")}
        >
          <Target className="h-5 w-5" strokeWidth={2} />
        </div>
      </motion.div>
    </>
  );
}
