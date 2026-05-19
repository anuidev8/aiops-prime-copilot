"use client";

import { useEffect } from "react";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";
import type { AppNavId } from "@/shared/ui/layout/app-sidebar";

interface WorkspaceViewportSyncProps {
  navId: AppNavId;
}

export function WorkspaceViewportSync({ navId }: WorkspaceViewportSyncProps) {
  const { setWorkspaceNavId } = useAIOpsSession();

  useEffect(() => {
    setWorkspaceNavId(navId);
  }, [navId, setWorkspaceNavId]);

  return null;
}
