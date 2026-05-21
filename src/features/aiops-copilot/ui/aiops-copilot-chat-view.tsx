"use client";

import {
  CopilotChat,
  CopilotChatUserMessage,
  type CopilotChatUserMessageProps,
  CopilotChatView,
  type CopilotChatViewProps,
} from "@copilotkit/react-core/v2";
import { motion, useReducedMotion } from "framer-motion";
import { aiopsCopilotChatInputConfig } from "@/features/aiops-copilot/ui/aiops-copilot-chat-input";
import { VOICE_TRANSCRIPT_MESSAGE_ID_PREFIX } from "@/features/voice-live/lib/voice-live-config";
import { useAIOpsSession } from "@/processes/aiops-analysis-session/model/aiops-session-context";

const easeOut = [0.32, 0.72, 0, 1] as const;

/** Applied to Streamdown inside the assistant bubble (CopilotKit v2 markdownRenderer slot). */
const assistantBubbleClass =
  "inline-block w-fit max-w-full rounded-xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 shadow-none [&_p]:my-0 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0";

/** Applied to user MessageRenderer (actual bubble), not the outer row wrapper. */
const userBubbleClass =
  "!inline-block !w-fit !max-w-[85%] !rounded-xl !rounded-tr-sm !border-0 !bg-slate-100 !px-3.5 !py-2.5 !text-sm !text-slate-800 !shadow-none whitespace-pre-wrap";

const welcomeBubbleClass =
  "w-fit max-w-[min(85%,20rem)] rounded-xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700";

function isVoiceTranscriptMessageId(messageId: string): boolean {
  return messageId.startsWith(VOICE_TRANSCRIPT_MESSAGE_ID_PREFIX);
}

function VoiceAwareUserMessage({
  message,
  className,
  messageRenderer,
  ...rest
}: CopilotChatUserMessageProps) {
  if (isVoiceTranscriptMessageId(message.id)) {
    return null;
  }

  return (
    <CopilotChatUserMessage
      {...rest}
      message={message}
      className={["!pt-2", className].filter(Boolean).join(" ")}
      messageRenderer={messageRenderer ?? userBubbleClass}
    />
  );
}

function AIOpsChatWelcome({
  input,
  suggestionView,
  className,
  ...rest
}: React.ComponentProps<typeof CopilotChatView.WelcomeScreen>) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div
      className={["flex h-full min-h-0 flex-col justify-end gap-3 px-3 pb-2", className ?? ""].join(
        " ",
      )}
      {...rest}
    >
      <motion.div
        className={welcomeBubbleClass}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
      >
        <p>Hey there! How can I help you today?</p>
        <p className="mt-1 text-xs text-slate-500">
          Ask for summaries, project drill-down, root-cause analysis, or report canvas actions.
        </p>
      </motion.div>

      {suggestionView ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.24 }}
        >
          {suggestionView}
        </motion.div>
      ) : null}

      {input ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.28, ease: easeOut }}
        >
          {input}
        </motion.div>
      ) : null}
    </div>
  );
}

function AIOpsChatFeather({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent",
        className ?? "",
      ].join(" ")}
    />
  );
}

function mergeObjectSlot<T extends Record<string, unknown>>(
  base: T,
  override?: T | string,
): T {
  if (!override) {
    return base;
  }
  if (typeof override === "string") {
    return { ...base, className: [base.className, override].filter(Boolean).join(" ") };
  }
  return {
    ...base,
    ...override,
    className: [base.className, override.className].filter(Boolean).join(" "),
  };
}

function AIOpsCopilotChatViewInner(props: CopilotChatViewProps) {
  const {
    className,
    messages,
    messageView,
    input,
    scrollView,
    suggestionView,
    welcomeScreen,
    ...rest
  } = props;
  const { executionChannel, voiceSessionStatus } = useAIOpsSession();
  const voiceSurfaceActive = voiceSessionStatus !== "disconnected";

  const filteredMessages = (messages ?? []).filter((message) => {
    if (voiceSurfaceActive) {
      return false;
    }
    if (isVoiceTranscriptMessageId(message.id)) {
      return false;
    }
    if (executionChannel !== "voice") {
      return true;
    }
    return message.role === "user";
  });

  const messageViewObject =
    typeof messageView === "object" && messageView !== null ? messageView : undefined;
  const inputObject = typeof input === "object" && input !== null ? input : undefined;
  const scrollViewObject =
    typeof scrollView === "object" && scrollView !== null ? scrollView : undefined;
  const suggestionViewObject =
    typeof suggestionView === "object" && suggestionView !== null ? suggestionView : undefined;

  return (
    <CopilotChat.View
      {...rest}
      messages={filteredMessages}
      className={["aiops-copilot-chat flex h-full min-h-0 flex-col", className]
        .filter(Boolean)
        .join(" ")}
      welcomeScreen={voiceSurfaceActive ? false : welcomeScreen === false ? false : AIOpsChatWelcome}
      messageView={mergeObjectSlot(
        {
          className: "flex flex-col gap-3 px-0 py-2 text-sm",
          assistantMessage: {
            className: "max-w-[min(85%,20rem)] self-start",
            markdownRenderer: {
              className: assistantBubbleClass,
            },
            toolbar:
              "mt-1.5 border-t border-slate-100/80 pt-1.5 text-slate-400 opacity-80 hover:opacity-100",
          },
          userMessage: VoiceAwareUserMessage as unknown as typeof CopilotChatUserMessage,
        },
        messageViewObject,
      )}
      scrollView={mergeObjectSlot(
        {
          className:
            "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-2",
          feather: AIOpsChatFeather,
        },
        scrollViewObject,
      )}
      input={mergeObjectSlot(
        aiopsCopilotChatInputConfig,
        voiceSurfaceActive
          ? {
              className: "hidden pointer-events-none",
            }
          : inputObject,
      )}
      suggestionView={mergeObjectSlot(
        {
          className: voiceSurfaceActive ? "hidden" : "flex flex-wrap gap-2",
        },
        suggestionViewObject,
      )}
    />
  );
}

export const AIOpsCopilotChatView = Object.assign(
  AIOpsCopilotChatViewInner,
  CopilotChat.View,
);
