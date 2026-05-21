import type { ProjectOwnershipViewModel } from "@/shared/types/aiops";

export interface NetworkNodeLayout {
  id: string;
  project: ProjectOwnershipViewModel;
  x: number;
  y: number;
  z: number;
  companyId: string;
  companyIndex: number;
}

export interface NetworkEdgeLayout {
  from: string;
  to: string;
  kind: "intra-company" | "hub";
}

const COMPANY_PALETTE = [
  0x22d3ee,
  0x818cf8,
  0x2dd4bf,
  0xf472b6,
  0xa3e635,
  0x38bdf8,
] as const;

export function companyColorHex(companyIndex: number): number {
  return COMPANY_PALETTE[companyIndex % COMPANY_PALETTE.length];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, offset = 0): number {
  const x = Math.sin(seed * 0.0001 + offset * 42.381) * 43758.5453123;
  return x - Math.floor(x);
}

/** Portfolio hub at origin; each company is a cluster; each project is a node in that cluster. */
export function buildProjectNetworkLayout(
  projects: ProjectOwnershipViewModel[],
): { nodes: NetworkNodeLayout[]; edges: NetworkEdgeLayout[]; hubId: string } {
  if (projects.length === 0) {
    return { nodes: [], edges: [], hubId: "portfolio-hub" };
  }

  const byCompany = new Map<string, ProjectOwnershipViewModel[]>();
  for (const project of projects) {
    const list = byCompany.get(project.companyId) ?? [];
    list.push(project);
    byCompany.set(project.companyId, list);
  }

  const companyIds = Array.from(byCompany.keys()).sort((a, b) => {
    const countDiff = (byCompany.get(b)?.length ?? 0) - (byCompany.get(a)?.length ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });
  const nodes: NetworkNodeLayout[] = [];
  const edges: NetworkEdgeLayout[] = [];
  const hubId = "portfolio-hub";
  const maxProjectsPerCompany = Math.max(
    ...companyIds.map((companyId) => byCompany.get(companyId)?.length ?? 0),
  );
  const baseClusterRadius = 3.2;
  const companyBandSpread = Math.min(2.4, Math.max(0.7, companyIds.length * 0.2));
  const intraEdgeSeen = new Set<string>();
  const hubEdgeSeen = new Set<string>();

  const addHubEdge = (to: string): void => {
    if (hubEdgeSeen.has(to)) return;
    hubEdgeSeen.add(to);
    edges.push({ from: hubId, to, kind: "hub" });
  };

  const addIntraEdge = (from: string, to: string): void => {
    if (from === to) return;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (intraEdgeSeen.has(key)) return;
    intraEdgeSeen.add(key);
    edges.push({ from, to, kind: "intra-company" });
  };

  companyIds.forEach((companyId, companyIndex) => {
    const companyProjects = byCompany.get(companyId) ?? [];
    const companySeed = hashString(companyId);
    const companyWeight = companyProjects.length / Math.max(1, maxProjectsPerCompany);
    const clusterAngle =
      (companyIndex / companyIds.length) * Math.PI * 2 +
      (seededUnit(companySeed, 0.21) - 0.5) * 0.5;
    const clusterRadius =
      baseClusterRadius +
      companyBandSpread +
      companyWeight * 0.95 +
      (seededUnit(companySeed, 0.73) - 0.5) * 0.5;
    const cx = Math.cos(clusterAngle) * clusterRadius;
    const cz = Math.sin(clusterAngle) * clusterRadius;
    const cy =
      Math.sin(clusterAngle * 1.85) * 0.28 +
      (seededUnit(companySeed, 0.44) - 0.5) * 0.66;
    const projectOrbitBase =
      0.74 + Math.min(1.45, Math.sqrt(companyProjects.length + 1) * 0.2);
    const orbitVariance = 0.14 + companyWeight * 0.08;
    const companyPhase = seededUnit(companySeed, 0.92) * Math.PI * 2;

    companyProjects.forEach((project, projectIndex) => {
      const projectSeed = hashString(project.id);
      const localAngle =
        companyPhase +
        (projectIndex / Math.max(companyProjects.length, 1)) * Math.PI * 2;
      const localOrbit =
        projectOrbitBase +
        (seededUnit(projectSeed, 0.51) - 0.5) * orbitVariance;
      const lift =
        (projectIndex - (companyProjects.length - 1) / 2) * 0.19 +
        Math.sin(localAngle * 1.8 + clusterAngle) * 0.09;

      nodes.push({
        id: project.id,
        project,
        companyId,
        companyIndex,
        x: cx + Math.cos(localAngle) * localOrbit,
        y: cy + lift,
        z: cz + Math.sin(localAngle) * localOrbit,
      });
    });

    const ringIds = companyProjects.map((project) => project.id);
    const first = ringIds[0];
    if (first) addHubEdge(first);

    if (ringIds.length >= 4) {
      addHubEdge(ringIds[Math.floor(ringIds.length / 2)]);
    }

    for (let i = 0; i < ringIds.length; i += 1) {
      const from = ringIds[i];
      const to = ringIds[(i + 1) % ringIds.length];
      if (ringIds.length <= 2 && i === ringIds.length - 1) continue;
      addIntraEdge(from, to);
    }

    if (ringIds.length >= 5) {
      for (let i = 0; i < ringIds.length; i += 2) {
        const from = ringIds[i];
        const to = ringIds[(i + 2) % ringIds.length];
        addIntraEdge(from, to);
      }
    }
  });

  return { nodes, edges, hubId };
}
