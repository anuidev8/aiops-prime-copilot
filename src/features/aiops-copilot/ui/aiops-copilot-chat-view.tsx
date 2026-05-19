"use client";

import {
  CopilotChat,
  CopilotChatView,
  type CopilotChatViewProps,
} from "@copilotkit/react-core/v2";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const COPILOT_AVATAR_SRC = "/images/copilot-avatar.png";

const easeOut = [0.32, 0.72, 0, 1] as const;

const assistantMessageClass =
  "aiops-copilot-assistant-msg max-w-[94%] rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm leading-relaxed text-foreground";

const userMessageClass =
  "aiops-copilot-user-msg ml-auto max-w-[88%] rounded-2xl rounded-br-md border border-primary/25 bg-primary px-4 py-2.5 text-sm text-primary-foreground";

function AIOpsChatWelcome({
  input,
  suggestionView,
  className,
  ...rest
}: React.ComponentProps<typeof CopilotChatView.WelcomeScreen>) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <div
      className={[
        "flex h-full min-h-0 flex-col justify-end gap-4 px-1 pb-2",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      <motion.div
        className="rounded-2xl border border-border bg-secondary/30 p-5"
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: easeOut }}
      >
        <motion.div
          className="flex items-start gap-3"
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.3, ease: easeOut }}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
            <Image
              src={COPILOT_AVATAR_SRC}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover object-top"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
              Hello, I can help explain your data
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ask for summaries, project drill-down, root-cause analysis, or report canvas actions.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {suggestionView ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.28 }}
        >
          {suggestionView}
        </motion.div>
      ) : null}

      {input ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.3, ease: easeOut }}
        >
          {input}
        </motion.div>
      ) : null}
    </div>
  );
}

function AIOpsChatFeather({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      className={[
        "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent",
        className ?? "",
      ].join(" ")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
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
    messageView,
    input,
    scrollView,
    suggestionView,
    welcomeScreen,
    ...rest
  } = props;

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
      className={["aiops-copilot-chat flex h-full min-h-0 flex-col", className]
        .filter(Boolean)
        .join(" ")}
      welcomeScreen={welcomeScreen === false ? false : AIOpsChatWelcome}
      messageView={mergeObjectSlot(
        {
          className: "flex flex-col gap-4 px-1 py-2",
          assistantMessage: {
            className: assistantMessageClass,
            markdownRenderer: {
              className:
                "prose prose-sm max-w-none prose-p:my-1 prose-headings:font-display prose-headings:text-foreground prose-a:text-primary",
            },
            toolbar: "mt-2 border-t border-border pt-2 opacity-70 hover:opacity-100",
          },
          userMessage: {
            className: userMessageClass,
          },
        },
        messageViewObject,
      )}
      scrollView={mergeObjectSlot(
        {
          className: "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1",
          feather: AIOpsChatFeather,
        },
        scrollViewObject,
      )}
      input={mergeObjectSlot(
        {
          className:
            "aiops-copilot-input rounded-2xl border border-border bg-white p-2 shadow-[0_10px_26px_-20px_hsl(225_30%_30%/0.45)]",
          textArea:
            "min-h-[48px] max-h-36 resize-none border-0 bg-transparent px-3 py-2.5 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0",
          sendButton:
            "h-9 w-9 shrink-0 rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40",
          disclaimer: "px-2 pt-1 text-[10px] text-muted-foreground/80",
        },
        inputObject,
      )}
      suggestionView={mergeObjectSlot(
        {
          className: "flex flex-wrap gap-2 px-1",
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
