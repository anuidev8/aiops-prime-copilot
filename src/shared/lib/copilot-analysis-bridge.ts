/** Copilot must not re-run analyzeLogs after the UI already executed the ADK stream pipeline. */
export const COPILOT_POST_ADK_ANALYSIS_PREFIX =
  "[System: ADK multi-agent analysis already completed. Session context includes incidents, analyses, primeReport, and agentPipeline. Summarize technical findings and business impact from that context only. Do NOT call analyzeLogs.]";

export function buildCopilotSummarizeAfterAnalysisMessage(userMessage: string): string {
  return `${COPILOT_POST_ADK_ANALYSIS_PREFIX}\n\nUser request: ${userMessage}`;
}

export function isPostAdkAnalysisCopilotMessage(message: string): boolean {
  return message.trimStart().startsWith(COPILOT_POST_ADK_ANALYSIS_PREFIX);
}
