export interface StreamToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamParseState {
  requestedToolCalls: Record<number, StreamToolCall>;
  finishReason: string | null;
}

export function consumeSseBuffer(
  buffer: string,
  chunk: string,
): { events: string[]; rest: string } {
  return splitSseEvents(buffer + chunk);
}

export function flushSseBuffer(buffer: string): string[] {
  const trimmed = buffer.replace(/\r$/, "").trim();
  if (!trimmed) return [];
  return splitSseEvents(trimmed + "\n").events;
}

export function applyStreamChoice(
  state: StreamParseState,
  choice: any,
): { content: string; reasoning: string } {
  const delta = choice?.delta;
  if (Array.isArray(delta?.tool_calls)) {
    delta.tool_calls.forEach((toolCall: any, position: number) => {
      mergeToolCall(state, toolCall, "delta", position);
    });
  }

  const messageToolCalls = choice?.message?.tool_calls;
  if (Array.isArray(messageToolCalls)) {
    messageToolCalls.forEach((toolCall: any, position: number) => {
      mergeToolCall(state, toolCall, "snapshot", position);
    });
  }

  if (choice?.finish_reason) {
    state.finishReason = choice.finish_reason;
  }

  return {
    content: typeof delta?.content === "string" ? delta.content : "",
    reasoning:
      typeof delta?.reasoning_content === "string" ? delta.reasoning_content : "",
  };
}

function splitSseEvents(text: string): { events: string[]; rest: string } {
  const lines = text.split("\n");
  const rest = lines.pop() ?? "";
  const events: string[] = [];
  for (const line of lines) {
    const trimmed = line.replace(/\r$/, "").trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    events.push(data);
  }
  return { events, rest };
}

function mergeToolCall(
  state: StreamParseState,
  toolCall: any,
  mode: "delta" | "snapshot",
  position: number,
): void {
  const index = toolCallIndex(toolCall, state.requestedToolCalls, mode, position);
  const name = readToolName(toolCall);
  const args = readToolArguments(toolCall);
  const current = state.requestedToolCalls[index];

  if (!current) {
    state.requestedToolCalls[index] = {
      id: toolCall?.id || "",
      type: "function",
      function: { name, arguments: args },
    };
    return;
  }

  if (toolCall?.id && !current.id) {
    current.id = toolCall.id;
  }
  current.function.name = mergeToolName(current.function.name, name);
  if (!args) return;

  if (mode === "snapshot") {
    if (isJson(args) || !current.function.arguments) {
      current.function.arguments = args;
    }
    return;
  }

  current.function.arguments += args;
}

function toolCallIndex(
  toolCall: any,
  calls: Record<number, StreamToolCall>,
  mode: "delta" | "snapshot",
  position: number,
): number {
  const rawIndex = toolCall?.index;
  if (typeof rawIndex === "number" && Number.isFinite(rawIndex)) return rawIndex;
  if (typeof rawIndex === "string" && rawIndex.trim() && Number.isFinite(Number(rawIndex))) {
    return Number(rawIndex);
  }
  if (mode === "snapshot") return position;

  const indexes = Object.keys(calls)
    .map((key) => Number(key))
    .filter((index) => Number.isFinite(index));
  if (!indexes.length) return 0;
  return Math.max(...indexes);
}

function readToolName(toolCall: any): string {
  const name =
    toolCall?.function?.name ?? toolCall?.name ?? toolCall?.function_name ?? "";
  return typeof name === "string" ? name : "";
}

function readToolArguments(toolCall: any): string {
  const args = toolCall?.function?.arguments ?? toolCall?.arguments ?? "";
  if (typeof args === "string") return args;
  if (args && typeof args === "object") return JSON.stringify(args);
  return "";
}

function mergeToolName(current: string, incoming: string): string {
  if (!incoming) return current;
  if (!current || incoming.startsWith(current)) return incoming;
  if (current.startsWith(incoming)) return current;
  return current + incoming;
}

function isJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
