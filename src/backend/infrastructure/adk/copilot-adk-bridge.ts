import { randomUUID } from "crypto";
import {
  InMemoryRunner,
  StreamingMode,
  toStructuredEvents,
} from "@google/adk";
import { userTextMessage } from "./adk-helpers";
import { type BaseEvent, type Message, type RunAgentInput } from "@ag-ui/client";
import { createAIOpsCoordinatorAgent } from "./aiops-coordinator";
import { mapAdkStructuredToAgUi } from "./copilot-adk-bridge-mapper";

function messageText(message: Message): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function buildCoordinatorUserPrompt(input: RunAgentInput): string {
  const sections: string[] = [];

  if (input.context && input.context.length > 0) {
    sections.push(
      `Session context (JSON):\n${JSON.stringify(input.context, null, 2)}`,
    );
  }

  const userMessages = input.messages.filter((message) => message.role === "user");
  const latestUser = userMessages.at(-1);

  if (latestUser) {
    sections.push(`User request:\n${messageText(latestUser)}`);
  } else {
    sections.push("User request:\n(continue from session context)");
  }

  return sections.join("\n\n");
}

export async function* streamAdkCoordinatorAsAgUiEvents(
  input: RunAgentInput,
  abortSignal?: AbortSignal,
): AsyncGenerator<BaseEvent> {
  const agent = createAIOpsCoordinatorAgent("copilot");
  const runner = new InMemoryRunner({
    agent,
    appName: "aiops-prime-copilot",
  });

  const userId = input.threadId ?? "copilot-user";
  const sessionId = input.threadId ?? `session-${randomUUID()}`;

  await runner.sessionService.getOrCreateSession({
    appName: "aiops-prime-copilot",
    userId,
    sessionId,
  });

  const prompt = buildCoordinatorUserPrompt(input);
  const messageId = randomUUID();
  const bridgeState = {
    messageId,
    toolCalls: new Map<string, { name: string; started: boolean; ended: boolean }>(),
  };

  const eventStream = runner.runAsync({
    userId,
    sessionId,
    newMessage: userTextMessage(prompt),
    runConfig: {
      streamingMode: StreamingMode.SSE,
      maxLlmCalls: 12,
    },
  });

  for await (const rawEvent of eventStream) {
    if (abortSignal?.aborted) {
      return;
    }

    for (const structured of toStructuredEvents(rawEvent)) {
      yield* mapAdkStructuredToAgUi(structured, bridgeState);
    }
  }
}
