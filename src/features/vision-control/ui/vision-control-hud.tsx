"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Hand,
  Loader2,
  MessageCircle,
  Network,
  Play,
  Scan,
} from "lucide-react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import {
  nearestHitId,
  type ScreenPoint,
} from "@/features/vision-control/lib/hand-gestures";
import { useMediapipeVision } from "@/features/vision-control/hooks/use-mediapipe-vision";
import { useVisionAnalysisBridge } from "@/features/vision-control/hooks/use-vision-analysis-bridge";
import { useVisionCopilotAsk } from "@/features/vision-control/hooks/use-vision-copilot-ask";
import { buildWorkspaceTelemetryMetrics } from "@/shared/lib/build-workspace-telemetry-metrics";
import {
  ProjectNetworkCanvas,
  type ProjectScreenTarget,
} from "@/features/vision-control/ui/project-network-canvas";
import { ProjectAnalysisHologramCard } from "@/features/vision-control/ui/project-analysis-hologram-card";
import { VisionHandCursor } from "@/features/vision-control/ui/vision-hand-cursor";
import { VisionResultsOverlay } from "@/features/vision-control/ui/vision-results-overlay";

const HIT_RADIUS_PX = 72;

function pointInsideElement(
  point: ScreenPoint,
  element: HTMLElement | null,
): boolean {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

export function VisionControlHud() {
  const { projectCatalog, projectCatalogLoading, selectedScope } = useAIOpsSession();
  const {
    analyzeProject,
    isAnalyzing,
    result,
    artifactCache,
    workflow,
    agentPipeline,
    error,
  } = useVisionAnalysisBridge();
  const { askCopilot, agentRunning } = useVisionCopilotAsk();

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showNetwork, setShowNetwork] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [readyResultsDismissedAt, setReadyResultsDismissedAt] = useState<string | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const screenTargetsRef = useRef<ProjectScreenTarget[]>([]);
  const [askPrompt, setAskPrompt] = useState("");
  const [lastCopilotReply, setLastCopilotReply] = useState<string | null>(null);
  const askPanelRef = useRef<HTMLDivElement | null>(null);
  const runPrimaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const runFooterButtonRef = useRef<HTMLButtonElement | null>(null);

  const {
    webcamRef,
    gesture,
    cameraReady,
    cameraError,
    handleUserMedia,
    handleUserMediaError,
  } = useMediapipeVision(cameraEnabled);

  const projects = projectCatalog;
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const selectedProject = selectedProjectId
    ? (projectById.get(selectedProjectId) ?? null)
    : null;
  const cacheProjectId = useMemo(
    () =>
      artifactCache.query?.resolvedProjectId ??
      artifactCache.query?.requestedProjectId ??
      selectedScope?.projectId ??
      null,
    [artifactCache.query, selectedScope?.projectId],
  );
  const cacheHasArtifacts = useMemo(
    () =>
      artifactCache.incidents.length > 0 ||
      artifactCache.analyses.length > 0 ||
      artifactCache.primeReport !== null ||
      artifactCache.workspaceMetrics !== null,
    [
      artifactCache.analyses.length,
      artifactCache.incidents.length,
      artifactCache.primeReport,
      artifactCache.workspaceMetrics,
    ],
  );
  const hasCachedInsights = useMemo(
    () =>
      Boolean(
        selectedProject &&
          cacheHasArtifacts &&
          cacheProjectId &&
          cacheProjectId === selectedProject.id,
      ),
    [cacheHasArtifacts, cacheProjectId, selectedProject],
  );
  const cachedMetrics = useMemo(() => {
    if (!selectedProject || !hasCachedInsights) {
      return null;
    }

    if (artifactCache.workspaceMetrics) {
      return artifactCache.workspaceMetrics;
    }

    if (!artifactCache.query) {
      return null;
    }

    return buildWorkspaceTelemetryMetrics({
      incidents: artifactCache.incidents,
      query: artifactCache.query,
      resolvedServiceCount:
        artifactCache.query.resolvedServiceCount ??
        selectedProject.serviceNames.length,
    });
  }, [
    artifactCache.incidents,
    artifactCache.query,
    artifactCache.workspaceMetrics,
    hasCachedInsights,
    selectedProject,
  ]);
  const cachedPrimeKpiCount = hasCachedInsights
    ? (artifactCache.primeReport?.kpis.length ?? 0)
    : 0;
  const cachedIncidentCount = hasCachedInsights ? artifactCache.incidents.length : 0;
  const readyStageToken =
    workflow.stage === "ready" && !isAnalyzing ? workflow.updatedAt : null;
  const showReadyResults =
    readyStageToken !== null && readyResultsDismissedAt !== readyStageToken;
  const resultsOverlayOpen = showResults || showReadyResults;

  const selectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const sendAskPrompt = useCallback(() => {
    if (!askPrompt.trim() || agentRunning) return;
    void askCopilot(askPrompt).then((reply) => {
      if (reply) setLastCopilotReply(reply);
    });
  }, [agentRunning, askCopilot, askPrompt]);

  const startAnalysis = useCallback(async () => {
    if (!selectedProject || isAnalyzing) return;
    setShowResults(true);
    await analyzeProject(selectedProject);
  }, [analyzeProject, isAnalyzing, selectedProject]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!cameraEnabled || !gesture.handPos) {
        setHoveredProjectId((current) => (current === null ? current : null));
        return;
      }

      const hovered = nearestHitId(
        gesture.handPos,
        screenTargetsRef.current,
        HIT_RADIUS_PX,
      );
      setHoveredProjectId((current) => (current === hovered ? current : hovered));
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [cameraEnabled, gesture.handPos]);

  useEffect(() => {
    if (!cameraEnabled || !gesture.isClicking || !gesture.handPos) return;

    if (
      pointInsideElement(gesture.handPos, runPrimaryButtonRef.current) ||
      pointInsideElement(gesture.handPos, runFooterButtonRef.current)
    ) {
      void startAnalysis();
      return;
    }

    if (pointInsideElement(gesture.handPos, askPanelRef.current)) {
      sendAskPrompt();
      return;
    }

    const hovered = nearestHitId(
      gesture.handPos,
      screenTargetsRef.current,
      HIT_RADIUS_PX,
    );
    if (hovered) {
      selectProject(hovered);
    }
  }, [
    cameraEnabled,
    gesture.handPos,
    gesture.isClicking,
    selectProject,
    sendAskPrompt,
    startAnalysis,
  ]);

  return (
    <div
      className={[
        "fixed inset-0 z-50 overflow-hidden bg-slate-950 text-zinc-100",
        cameraEnabled ? "cursor-none select-none" : "",
      ].join(" ")}
    >
      {cameraEnabled ? (
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f172a_0%,_#020617_70%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.72)_100%)]" />

      {showNetwork && projects.length > 0 ? (
        <ProjectNetworkCanvas
          projects={projects}
          selectedId={selectedProjectId}
          hoveredId={hoveredProjectId}
          screenTargetsRef={screenTargetsRef}
          onSelectProject={selectProject}
          gestureEnabled={cameraEnabled && cameraReady}
          handPos={gesture.handPos}
          handGrabbing={gesture.isGrabbing}
        />
      ) : null}

      <VisionHandCursor gesture={gesture} visible={cameraEnabled && cameraReady} />

      <div className="pointer-events-none relative z-30 flex h-full flex-col">
        <header className="pointer-events-auto flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/aiops"
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-zinc-200 backdrop-blur-md hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/90">
                Vision command
              </p>
              <h1 className="text-lg font-semibold text-white">Jarvis HUD</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCameraEnabled((value) => !value)}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              {cameraEnabled ? (
                <CameraOff className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {cameraEnabled ? "Camera on" : "Enable camera"}
            </button>
            <button
              type="button"
              onClick={() => setShowNetwork((value) => !value)}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              <Network className="h-4 w-4" />
              {showNetwork ? "Hide network" : "Show network"}
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6">
          {projectCatalogLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading project catalog…
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-zinc-400">No projects in catalog.</p>
          ) : (
            <p className="max-w-lg text-center text-sm text-zinc-300/90">
              Each node is a project in your catalog. Click a label, tap a node,
              or pinch with the camera to select. The HUD first checks
              ADK/CopilotKit cache and shows a hologram metrics card; if no
              cache exists, run analysis from that card.
            </p>
          )}
        </div>

        <div
          ref={askPanelRef}
          className="pointer-events-auto absolute left-6 top-24 z-40 w-[280px] rounded-2xl border border-white/15 bg-slate-950/75 p-3 backdrop-blur-xl"
          data-vision-ask-panel
        >
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-cyan-200/90">
            <MessageCircle className="h-3.5 w-3.5" />
            Ask copilot
          </div>
          <textarea
            value={askPrompt}
            onChange={(event) => setAskPrompt(event.target.value)}
            rows={3}
            placeholder="e.g. Which project has the highest critical incident rate?"
            className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-cyan-400/50 focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={!askPrompt.trim() || agentRunning}
              onClick={sendAskPrompt}
              className="flex-1 rounded-lg bg-cyan-600/80 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              {agentRunning ? "Thinking…" : "Send to ADK"}
            </button>
          </div>
          {cameraEnabled ? (
            <p className="mt-2 text-[10px] text-zinc-500">
              Pinch over this panel to send hands-free.
            </p>
          ) : null}
          {lastCopilotReply ? (
            <p className="mt-2 line-clamp-4 text-xs text-zinc-300">
              {lastCopilotReply}
            </p>
          ) : null}
        </div>

        <ProjectAnalysisHologramCard
          project={selectedProject}
          hasCachedInsights={hasCachedInsights}
          metrics={cachedMetrics}
          cacheMeta={hasCachedInsights ? artifactCache.lastRunMeta : null}
          incidentCount={cachedIncidentCount}
          primeKpiCount={cachedPrimeKpiCount}
          canRunAnalysis={Boolean(selectedProject)}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={() => {
            void startAnalysis();
          }}
          onOpenResults={() => setShowResults(true)}
          runButtonRef={runPrimaryButtonRef}
        />

        <VisionResultsOverlay
          open={resultsOverlayOpen}
          workflow={workflow}
          agentPipeline={agentPipeline}
          result={result}
          artifactCache={artifactCache}
          error={error}
          onClose={() => {
            setShowResults(false);
            if (readyStageToken) {
              setReadyResultsDismissedAt(readyStageToken);
            }
          }}
        />

        <footer className="pointer-events-auto border-t border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Hand className="h-4 w-4 text-cyan-300" />
              {cameraEnabled && cameraReady
                ? "Hand tracking — pinch a node to select, pinch Run analysis to launch, or drag the network center to rotate"
                : cameraError
                  ? `Camera: ${cameraError}`
                  : "Enable camera for gesture control"}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                ref={runFooterButtonRef}
                type="button"
                disabled={!selectedProject || isAnalyzing}
                onClick={() => void startAnalysis()}
                className="flex items-center gap-2 rounded-lg bg-lime-500/90 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-lime-400 disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAnalyzing
                  ? "Running pipeline…"
                  : selectedProject
                    ? `Start analysis · ${selectedProject.name}`
                    : "Select a project first"}
              </button>
              <button
                type="button"
                onClick={() => setShowResults(true)}
                className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
              >
                <Scan className="h-4 w-4" />
                Results
              </button>
            </div>
          </div>

          {selectedProject ? (
            <p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-zinc-500">
              Selected: {selectedProject.name} · {selectedProject.serviceNames.length}{" "}
              services · workflow: {workflow.stage}
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
