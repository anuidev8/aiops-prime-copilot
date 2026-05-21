"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { applyNodeHighlight, createProjectNetworkScene } from "@/features/vision-control/lib/project-network-scene";
import type { ScreenPoint } from "@/features/vision-control/lib/hand-gestures";
import type { ProjectOwnershipViewModel } from "@/shared/types/aiops";

export interface ProjectScreenTarget {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface ProjectNetworkCanvasProps {
  projects: ProjectOwnershipViewModel[];
  selectedId: string | null;
  hoveredId: string | null;
  screenTargetsRef: React.MutableRefObject<ProjectScreenTarget[]>;
  onSelectProject: (projectId: string) => void;
  gestureEnabled?: boolean;
  handPos?: ScreenPoint | null;
  handGrabbing?: boolean;
}

export function ProjectNetworkCanvas({
  projects,
  selectedId,
  hoveredId,
  screenTargetsRef,
  onSelectProject,
  gestureEnabled = false,
  handPos = null,
  handGrabbing = false,
}: ProjectNetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const labelNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const meshByIdRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const handPosRef = useRef<ScreenPoint | null>(handPos);
  const handGrabbingRef = useRef(handGrabbing);
  const gestureEnabledRef = useRef(gestureEnabled);
  const onSelectRef = useRef(onSelectProject);

  useEffect(() => {
    onSelectRef.current = onSelectProject;
  }, [onSelectProject]);

  useEffect(() => {
    handPosRef.current = handPos;
  }, [handPos]);

  useEffect(() => {
    handGrabbingRef.current = handGrabbing;
  }, [handGrabbing]);

  useEffect(() => {
    gestureEnabledRef.current = gestureEnabled;
  }, [gestureEnabled]);

  const projectLayoutKey = useMemo(
    () => projects.map((project) => project.id).join("|"),
    [projects],
  );

  useEffect(() => {
    const labelsRoot = labelsRef.current;
    if (!labelsRoot) return;

    labelsRoot.innerHTML = "";
    const labelMap = new Map<string, HTMLDivElement>();

    for (const project of projects) {
      const label = document.createElement("div");
      label.className = [
        "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2",
        "cursor-pointer select-none rounded-md border border-white/15",
        "bg-slate-950/75 px-2 py-1 text-[10px] font-medium text-cyan-100",
        "backdrop-blur-sm transition-shadow whitespace-nowrap max-w-[140px] truncate",
      ].join(" ");
      label.title = project.name;
      label.textContent = project.name;
      label.addEventListener("click", () => onSelectRef.current(project.id));
      labelsRoot.appendChild(label);
      labelMap.set(project.id, label);
    }

    labelNodesRef.current = labelMap;
  }, [projectLayoutKey, projects]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || projects.length === 0) {
      screenTargetsRef.current = [];
      return undefined;
    }

    const network = createProjectNetworkScene(projects);
    meshByIdRef.current = network.nodeMeshes;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const resize = () => {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      network.camera.aspect = w / h;
      network.camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    resize();
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x8ecae6, 0.45);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(5, 8, 6);
    const rimLight = new THREE.PointLight(0x38bdf8, 1.6, 30);
    rimLight.position.set(-4, 2, 5);
    network.scene.add(ambient, keyLight, rimLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const vector = new THREE.Vector3();
    const cameraOrbit = {
      yawOffset: 0,
      yawVelocity: 0,
      pitchOffset: 0,
      pitchVelocity: 0,
    };
    const pointerDrag = {
      active: false,
      pointerId: -1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      moved: false,
    };
    const handDrag = {
      active: false,
      lastX: 0,
      lastY: 0,
    };
    const CAMERA_DISTANCE_BASE = 9.4;
    const MAX_YAW_VELOCITY = 0.045;
    const MAX_PITCH_VELOCITY = 0.035;

    const clampPitchOffset = (value: number): number =>
      Math.max(-0.44, Math.min(0.48, value));

    const applyOrbitDelta = (deltaX: number, deltaY: number): void => {
      const yawVelocityDelta = deltaX * 0.0008;
      const pitchVelocityDelta = deltaY * 0.00068;
      cameraOrbit.yawVelocity = Math.max(
        -MAX_YAW_VELOCITY,
        Math.min(MAX_YAW_VELOCITY, cameraOrbit.yawVelocity + yawVelocityDelta),
      );
      cameraOrbit.pitchVelocity = Math.max(
        -MAX_PITCH_VELOCITY,
        Math.min(MAX_PITCH_VELOCITY, cameraOrbit.pitchVelocity + pitchVelocityDelta),
      );
    };

    const pickProjectAt = (clientX: number, clientY: number): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, network.camera);
      const hits = raycaster.intersectObjects(network.pickables, false);
      const hit = hits.find((item) => item.object.userData.pickable);
      return (hit?.object.userData.id as string | undefined) ?? null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerDrag.active = true;
      pointerDrag.pointerId = event.pointerId;
      pointerDrag.startX = event.clientX;
      pointerDrag.startY = event.clientY;
      pointerDrag.lastX = event.clientX;
      pointerDrag.lastY = event.clientY;
      pointerDrag.moved = false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDrag.active || pointerDrag.pointerId !== event.pointerId) return;
      const dx = event.clientX - pointerDrag.lastX;
      const dy = event.clientY - pointerDrag.lastY;
      pointerDrag.lastX = event.clientX;
      pointerDrag.lastY = event.clientY;

      if (
        !pointerDrag.moved &&
        Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY) >
          6
      ) {
        pointerDrag.moved = true;
      }

      if (pointerDrag.moved) {
        applyOrbitDelta(dx, dy);
      }
    };

    const finishPointer = (event: PointerEvent) => {
      if (!pointerDrag.active || pointerDrag.pointerId !== event.pointerId) return;
      const shouldSelect = !pointerDrag.moved;
      pointerDrag.active = false;
      pointerDrag.pointerId = -1;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      if (shouldSelect) {
        const id = pickProjectAt(event.clientX, event.clientY);
        if (id) onSelectRef.current(id);
      }
    };

    const cancelPointer = (event: PointerEvent) => {
      if (!pointerDrag.active || pointerDrag.pointerId !== event.pointerId) return;
      pointerDrag.active = false;
      pointerDrag.pointerId = -1;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", finishPointer);
    renderer.domElement.addEventListener("pointercancel", cancelPointer);

    const basePositions = new Map(
      network.nodes.map((node) => [node.id, { x: node.x, y: node.y, z: node.z }]),
    );

    const startTime = performance.now();
    let frameId = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;

      const t = (now - startTime) / 1000;
      const hand = handPosRef.current;
      if (gestureEnabledRef.current && handGrabbingRef.current && hand) {
        const rect = renderer.domElement.getBoundingClientRect();
        const localX = hand.x - rect.left;
        const localY = hand.y - rect.top;
        const insideBounds =
          localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const centerRadius = Math.min(rect.width, rect.height) * 0.2;
        const inCenter = insideBounds &&
          Math.hypot(localX - centerX, localY - centerY) <= centerRadius;

        if (inCenter) {
          if (!handDrag.active) {
            handDrag.active = true;
            handDrag.lastX = localX;
            handDrag.lastY = localY;
          } else {
            applyOrbitDelta(localX - handDrag.lastX, localY - handDrag.lastY);
            handDrag.lastX = localX;
            handDrag.lastY = localY;
          }
        } else {
          handDrag.active = false;
        }
      } else {
        handDrag.active = false;
      }

      cameraOrbit.yawOffset += cameraOrbit.yawVelocity;
      cameraOrbit.pitchOffset = clampPitchOffset(
        cameraOrbit.pitchOffset + cameraOrbit.pitchVelocity,
      );
      cameraOrbit.yawVelocity *= 0.92;
      cameraOrbit.pitchVelocity *= 0.9;

      const autoYaw = Math.sin(t * 0.17) * 0.2;
      const autoPitch = Math.sin(t * 0.23) * 0.06;
      const yaw = autoYaw + cameraOrbit.yawOffset;
      const pitch = autoPitch + cameraOrbit.pitchOffset;
      const cameraDistance = CAMERA_DISTANCE_BASE + Math.cos(t * 0.33) * 0.45;

      network.camera.position.x = Math.sin(yaw) * cameraDistance;
      network.camera.position.z = Math.cos(yaw) * cameraDistance;
      network.camera.position.y = 2.1 + pitch * 3.2;
      network.camera.lookAt(0, 0, 0);

      network.hubMesh.rotation.y = t * 0.6;
      network.hubMesh.rotation.x = Math.sin(t * 0.4) * 0.2;

      for (const node of network.nodes) {
        const mesh = network.nodeMeshes.get(node.id);
        const base = basePositions.get(node.id);
        if (!mesh || !base) continue;
        mesh.position.set(
          base.x,
          base.y + Math.sin(t * 1.1 + base.x) * 0.08,
          base.z,
        );
      }

      renderer.render(network.scene, network.camera);

      const width = container.clientWidth;
      const height = container.clientHeight;
      const nextTargets: ProjectScreenTarget[] = [];

      for (const node of network.nodes) {
        const mesh = network.nodeMeshes.get(node.id);
        if (!mesh) continue;
        vector.copy(mesh.position).project(network.camera);
        const x = ((vector.x + 1) / 2) * width;
        const y = ((-vector.y + 1) / 2) * height;

        nextTargets.push({
          id: node.id,
          x,
          y,
          name: node.project.name,
        });

        const labelEl = labelNodesRef.current.get(node.id);
        if (labelEl) {
          labelEl.style.left = `${x}px`;
          labelEl.style.top = `${y - 28}px`;
          labelEl.style.opacity = vector.z < 1 ? "1" : "0.25";
        }
      }

      screenTargetsRef.current = nextTargets;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", finishPointer);
      renderer.domElement.removeEventListener("pointercancel", cancelPointer);
      screenTargetsRef.current = [];
      network.disposeSceneObjects();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      meshByIdRef.current = new Map();
    };
  }, [projectLayoutKey, projects, screenTargetsRef]);

  useEffect(() => {
    for (const [id, mesh] of meshByIdRef.current) {
      const state =
        id === selectedId ? "selected" : id === hoveredId ? "hover" : "default";
      applyNodeHighlight(mesh, state);
    }
  }, [selectedId, hoveredId]);

  useEffect(() => {
    for (const [id, label] of labelNodesRef.current) {
      if (id === selectedId) {
        label.classList.add("border-lime-400/70", "shadow-[0_0_16px_rgba(190,242,100,0.45)]");
        label.classList.remove("border-white/15");
      } else {
        label.classList.remove("border-lime-400/70", "shadow-[0_0_16px_rgba(190,242,100,0.45)]");
        label.classList.add("border-white/15");
      }
    }
  }, [selectedId]);

  return (
    <div className="absolute inset-0 z-20">
      <div ref={containerRef} className="absolute inset-0" aria-hidden />
      <div
        ref={labelsRef}
        className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto"
        aria-label="Project network"
      />
    </div>
  );
}
