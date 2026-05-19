"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { CopilotAvatarView } from "@/features/copilot-assistant/ui/copilot-avatar-view";
import { WorkspaceViewMode } from "@/shared/ui/layout/view-mode-toggle";

type CopilotTab = "chat" | "avatar";

interface CopilotAssistantPanelProps {
  chat: ReactNode;
  viewMode?: WorkspaceViewMode;
}

const easeOut = [0.32, 0.72, 0, 1] as const;
const pillTransition = { type: "spring" as const, stiffness: 400, damping: 32 };

export function CopilotAssistantPanel({ chat, viewMode }: CopilotAssistantPanelProps) {
  const [tab, setTab] = useState<CopilotTab>("chat");
  const activeTab: CopilotTab = viewMode === "avatar" ? "avatar" : tab;

  return (
    <div className="h-full min-h-[70vh] lg:min-h-[calc(100vh-10rem)] flex flex-col glass-strong rounded-2xl overflow-hidden">
      <div className="relative flex items-center gap-1 p-2 border-b border-border/40 shrink-0">
        {(["chat", "avatar"] as const).map((id) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "relative z-10 flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {active ? (
                <motion.span
                  layoutId="copilot-tab-pill"
                  className="absolute inset-0 rounded-lg bg-secondary/80 neon-ring"
                  transition={pillTransition}
                />
              ) : null}
              <span className="relative">{id}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "chat" ? (
            <motion.div
              key="chat"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              {chat}
            </motion.div>
          ) : (
            <motion.div
              key="avatar"
              className="absolute inset-0 flex flex-col min-h-0"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.32, ease: easeOut }}
            >
              <CopilotAvatarView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
