import * as THREE from "three";
import {
  buildProjectNetworkLayout,
  companyColorHex,
  type NetworkNodeLayout,
} from "@/features/vision-control/lib/project-network-layout";
import type { ProjectOwnershipViewModel } from "@/shared/types/aiops";

export interface ProjectNetworkScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  nodeMeshes: Map<string, THREE.Mesh>;
  hubMesh: THREE.Mesh;
  nodes: NetworkNodeLayout[];
  pickables: THREE.Object3D[];
  disposeSceneObjects: () => void;
}

interface PointLayerOptions {
  count: number;
  radius: number;
  height: number;
  color: number;
  size: number;
  opacity: number;
  random: () => number;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function meshMaterial<TMaterial extends THREE.Material>(
  mesh: THREE.Object3D | null | undefined,
): TMaterial | null {
  if (!(mesh instanceof THREE.Mesh)) return null;
  const material = mesh.material;
  if (Array.isArray(material)) {
    return (material[0] as TMaterial | undefined) ?? null;
  }
  return material as TMaterial;
}

function createPointLayer({
  count,
  radius,
  height,
  color,
  size,
  opacity,
  random,
}: PointLayerOptions): {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
} {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const r = Math.pow(random(), 0.62) * radius;
    const y = (random() - 0.5) * height;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return { points: new THREE.Points(geometry, material), geometry, material };
}

function createEnergyArc(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  kind: "intra-company" | "hub",
): {
  arc: THREE.Group;
  resources: Array<THREE.BufferGeometry | THREE.Material>;
} {
  const span = from.distanceTo(to);
  const dir = to.clone().sub(from);
  const tangent = new THREE.Vector3(-dir.z, 0, dir.x);
  if (tangent.lengthSq() > 0) {
    tangent.normalize();
  }

  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.addScaledVector(tangent, span * (kind === "hub" ? 0.08 : 0.13));
  mid.y += 0.22 + span * (kind === "hub" ? 0.11 : 0.18);
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);

  const glowGeometry = new THREE.TubeGeometry(curve, 28, kind === "hub" ? 0.022 : 0.03, 10, false);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: kind === "hub" ? 0.2 : 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreGeometry = new THREE.TubeGeometry(curve, 28, kind === "hub" ? 0.009 : 0.011, 10, false);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: kind === "hub" ? 0xe2e8f0 : color,
    transparent: true,
    opacity: kind === "hub" ? 0.62 : 0.84,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const arc = new THREE.Group();
  arc.add(
    new THREE.Mesh(glowGeometry, glowMaterial),
    new THREE.Mesh(coreGeometry, coreMaterial),
  );

  return {
    arc,
    resources: [glowGeometry, glowMaterial, coreGeometry, coreMaterial],
  };
}

export function createProjectNetworkScene(
  projects: ProjectOwnershipViewModel[],
): ProjectNetworkScene {
  const { nodes, edges, hubId } = buildProjectNetworkLayout(projects);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020617, 0.035);

  const nodeMeshes = new Map<string, THREE.Mesh>();
  const pickables: THREE.Object3D[] = [];
  const disposable: Array<THREE.BufferGeometry | THREE.Material> = [];
  const seed = hashString(
    projects.map((project) => project.id).sort((a, b) => a.localeCompare(b)).join("|"),
  );
  const random = createSeededRandom(seed || 1);

  const nearStars = createPointLayer({
    count: 340 + nodes.length * 8,
    radius: 22,
    height: 14,
    color: 0x7dd3fc,
    size: 0.045,
    opacity: 0.52,
    random,
  });
  const farStars = createPointLayer({
    count: 260 + nodes.length * 6,
    radius: 30,
    height: 20,
    color: 0xc4b5fd,
    size: 0.03,
    opacity: 0.3,
    random,
  });
  const haze = createPointLayer({
    count: 170,
    radius: 13,
    height: 8,
    color: 0x22d3ee,
    size: 0.14,
    opacity: 0.08,
    random,
  });
  disposable.push(
    nearStars.geometry,
    nearStars.material,
    farStars.geometry,
    farStars.material,
    haze.geometry,
    haze.material,
  );
  scene.add(farStars.points, nearStars.points, haze.points);

  const hubGeometry = new THREE.IcosahedronGeometry(0.34, 2);
  const hubMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.72,
    metalness: 0.82,
    roughness: 0.12,
  });
  disposable.push(hubGeometry, hubMaterial);
  const hubMesh = new THREE.Mesh(hubGeometry, hubMaterial);
  hubMesh.position.set(0, 0, 0);
  hubMesh.userData = { id: hubId, pickable: false };

  const hubAuraGeometry = new THREE.SphereGeometry(0.55, 26, 26);
  const hubAuraMaterial = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposable.push(hubAuraGeometry, hubAuraMaterial);
  const hubAura = new THREE.Mesh(hubAuraGeometry, hubAuraMaterial);
  hubAura.name = "hub-aura";
  hubMesh.add(hubAura);

  const hubRingGeometry = new THREE.TorusGeometry(0.58, 0.012, 12, 64);
  const hubRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.44,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  disposable.push(hubRingGeometry, hubRingMaterial);

  const hubRingX = new THREE.Mesh(hubRingGeometry, hubRingMaterial);
  hubRingX.rotation.x = Math.PI / 2;
  hubRingX.name = "hub-ring-x";
  const hubRingYMaterial = hubRingMaterial.clone();
  const hubRingY = new THREE.Mesh(hubRingGeometry, hubRingYMaterial);
  hubRingY.rotation.y = Math.PI / 2;
  hubRingY.name = "hub-ring-y";
  const hubRingZMaterial = hubRingMaterial.clone();
  const hubRingZ = new THREE.Mesh(hubRingGeometry, hubRingZMaterial);
  hubRingZ.name = "hub-ring-z";
  disposable.push(hubRingYMaterial, hubRingZMaterial);
  hubMesh.add(hubRingX, hubRingY, hubRingZ);

  scene.add(hubMesh);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    const baseColor = companyColorHex(node.companyIndex);
    const geometry = new THREE.IcosahedronGeometry(0.22, 2);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.46,
      metalness: 0.7,
      roughness: 0.14,
    });
    disposable.push(geometry, material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.x, node.y, node.z);
    mesh.userData = {
      id: node.id,
      pickable: true,
      baseColor,
      companyIndex: node.companyIndex,
    };

    const auraGeometry = new THREE.SphereGeometry(0.34, 20, 20);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposable.push(auraGeometry, auraMaterial);
    const aura = new THREE.Mesh(auraGeometry, auraMaterial);
    aura.name = "node-aura";
    mesh.add(aura);

    const shellGeometry = new THREE.IcosahedronGeometry(0.29, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      wireframe: true,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposable.push(shellGeometry, shellMaterial);
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.name = "node-shell";
    shell.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    mesh.add(shell);

    const ringGeometry = new THREE.TorusGeometry(0.36, 0.012, 10, 54);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposable.push(ringGeometry, ringMaterial);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.name = "node-ring";
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    const ringSecondaryGeometry = new THREE.TorusGeometry(0.3, 0.008, 10, 42);
    const ringSecondaryMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposable.push(ringSecondaryGeometry, ringSecondaryMaterial);
    const ringSecondary = new THREE.Mesh(
      ringSecondaryGeometry,
      ringSecondaryMaterial,
    );
    ringSecondary.name = "node-ring-secondary";
    ringSecondary.rotation.z = Math.PI / 2;
    mesh.add(ringSecondary);

    scene.add(mesh);
    nodeMeshes.set(node.id, mesh);
    pickables.push(mesh);
  }

  for (const edge of edges) {
    const from =
      edge.from === hubId
        ? new THREE.Vector3(0, 0, 0)
        : (() => {
            const n = nodeById.get(edge.from);
            return n ? new THREE.Vector3(n.x, n.y, n.z) : null;
          })();
    const toNode = nodeById.get(edge.to);
    if (!from || !toNode) continue;

    const to = new THREE.Vector3(toNode.x, toNode.y, toNode.z);
    const color =
      edge.kind === "hub"
        ? 0x67e8f9
        : companyColorHex(toNode.companyIndex);
    const arc = createEnergyArc(from, to, color, edge.kind);
    disposable.push(...arc.resources);
    scene.add(arc.arc);
  }

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  camera.position.set(0, 2.6, 10.2);

  return {
    scene,
    camera,
    nodeMeshes,
    hubMesh,
    nodes,
    pickables,
    disposeSceneObjects: () => {
      for (const item of disposable) {
        item.dispose();
      }
    },
  };
}

export function applyNodeHighlight(
  mesh: THREE.Mesh,
  state: "default" | "hover" | "selected",
): void {
  const material = mesh.material as THREE.MeshStandardMaterial;
  const baseColor = mesh.userData.baseColor as number;
  const auraMaterial = meshMaterial<THREE.MeshBasicMaterial>(
    mesh.getObjectByName("node-aura"),
  );
  const shellMaterial = meshMaterial<THREE.MeshBasicMaterial>(
    mesh.getObjectByName("node-shell"),
  );
  const ring = mesh.getObjectByName("node-ring");
  const ringMaterial = meshMaterial<THREE.MeshBasicMaterial>(ring);
  const ringSecondary = mesh.getObjectByName("node-ring-secondary");
  const ringSecondaryMaterial = meshMaterial<THREE.MeshBasicMaterial>(
    ringSecondary,
  );

  if (state === "selected") {
    material.color.setHex(0xd9f99d);
    material.emissive.setHex(0x84cc16);
    material.emissiveIntensity = 1.2;
    mesh.scale.setScalar(1.46);

    if (auraMaterial) {
      auraMaterial.color.setHex(0xd9f99d);
      auraMaterial.opacity = 0.48;
    }
    if (shellMaterial) {
      shellMaterial.color.setHex(0xb9ff54);
      shellMaterial.opacity = 0.82;
    }
    if (ringMaterial) {
      ringMaterial.color.setHex(0xb9ff54);
      ringMaterial.opacity = 0.95;
    }
    if (ringSecondaryMaterial) {
      ringSecondaryMaterial.color.setHex(0xecfccb);
      ringSecondaryMaterial.opacity = 0.62;
    }
    ring?.scale.setScalar(1.26);
    ringSecondary?.scale.setScalar(1.18);
    return;
  }

  if (state === "hover") {
    material.color.setHex(baseColor);
    material.emissive.setHex(baseColor);
    material.emissiveIntensity = 0.88;
    mesh.scale.setScalar(1.18);

    if (auraMaterial) {
      auraMaterial.color.setHex(baseColor);
      auraMaterial.opacity = 0.32;
    }
    if (shellMaterial) {
      shellMaterial.color.setHex(baseColor);
      shellMaterial.opacity = 0.58;
    }
    if (ringMaterial) {
      ringMaterial.color.setHex(baseColor);
      ringMaterial.opacity = 0.76;
    }
    if (ringSecondaryMaterial) {
      ringSecondaryMaterial.color.setHex(baseColor);
      ringSecondaryMaterial.opacity = 0.4;
    }
    ring?.scale.setScalar(1.12);
    ringSecondary?.scale.setScalar(1.08);
    return;
  }

  material.color.setHex(baseColor);
  material.emissive.setHex(baseColor);
  material.emissiveIntensity = 0.46;
  mesh.scale.setScalar(1);

  if (auraMaterial) {
    auraMaterial.color.setHex(baseColor);
    auraMaterial.opacity = 0.18;
  }
  if (shellMaterial) {
    shellMaterial.color.setHex(baseColor);
    shellMaterial.opacity = 0.36;
  }
  if (ringMaterial) {
    ringMaterial.color.setHex(baseColor);
    ringMaterial.opacity = 0.5;
  }
  if (ringSecondaryMaterial) {
    ringSecondaryMaterial.color.setHex(baseColor);
    ringSecondaryMaterial.opacity = 0.24;
  }
  ring?.scale.setScalar(1);
  ringSecondary?.scale.setScalar(1);
}
