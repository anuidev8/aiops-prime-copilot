"use client";

import type { CopilotChatInputProps } from "@copilotkit/react-core/v2";
import type { ReactNode, Ref } from "react";

type InputLayoutProps = {
  textArea: ReactNode;
  sendButton: ReactNode;
  disclaimer?: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
};

function AIOpsCopilotInputLayout({
  textArea,
  sendButton,
  disclaimer,
  containerRef,
}: InputLayoutProps) {
  return (
    <div ref={containerRef} className="w-full pointer-events-auto">
      <div
        className={[
          "flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2",
          "shadow-sm transition-colors focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400",
          "[&_.copilotKitInput]:border-0 [&_.copilotKitInput]:bg-transparent [&_.copilotKitInput]:shadow-none",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1 [&_textarea]:min-h-[36px] [&_textarea]:py-2 [&_textarea]:text-sm">
          {textArea}
        </div>
        <div className="flex shrink-0 items-center pb-0.5">{sendButton}</div>
      </div>
      {disclaimer}
    </div>
  );
}

export const aiopsCopilotChatInputConfig: CopilotChatInputProps = {
  positioning: "static",
  bottomAnchored: true,
  autoFocus: true,
  className: [
    "relative z-30 w-full shrink-0 border-t border-slate-100 bg-white px-3 py-3",
    "pointer-events-auto",
  ].join(" "),
  textArea:
    "w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
  sendButton:
    "h-9 w-9 shrink-0 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600",
  disclaimer: "mt-2 text-center text-[10px] font-medium text-slate-400",
  children: AIOpsCopilotInputLayout,
};
