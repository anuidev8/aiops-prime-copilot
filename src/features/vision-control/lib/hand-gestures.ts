export interface ScreenPoint {
  x: number;
  y: number;
}

export interface HandGestureState {
  handPos: ScreenPoint | null;
  facePos: ScreenPoint | null;
  isGrabbing: boolean;
  isClicking: boolean;
}

const GRAB_THRESHOLD = 0.05;

export function landmarkToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
): ScreenPoint {
  return { x: (1 - x) * width, y: y * height };
}

export function isPinchGrab(
  thumbX: number,
  thumbY: number,
  indexX: number,
  indexY: number,
): boolean {
  return Math.hypot(indexX - thumbX, indexY - thumbY) < GRAB_THRESHOLD;
}

export function detectPinchClick(
  isGrabbing: boolean,
  wasGrabbing: boolean,
): boolean {
  return isGrabbing && !wasGrabbing;
}

export function nearestHitId(
  point: ScreenPoint,
  targets: Array<{ id: string; x: number; y: number }>,
  radiusPx: number,
): string | null {
  let bestId: string | null = null;
  let bestDist = radiusPx;

  for (const target of targets) {
    const dist = Math.hypot(point.x - target.x, point.y - target.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = target.id;
    }
  }

  return bestId;
}
