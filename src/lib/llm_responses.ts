import { Tool } from "./tool_types";

export interface ResponsesToolCallState {
  id: string;
  itemId: string;
  outputIndex: number;
  name: string;
  arguments: string;
}

export interface ResponsesParseState {
  content: string;
  reasoning: string;
  toolCalls: ResponsesToolCallState[];
  completed: boolean;
  failedMessage: string | null;
}

export function createResponsesParseState(): ResponsesParseState {
  return {
    content: "",
    reasoning: "",
    toolCalls: [],
    completed: false,
    failedMessage: null,
  };
}

export function buildResponsesCheckpointBody(model = "") {
  return {
    model,
    input: "Validate this endpoint.",
    stream: false,
    max_output_tokens: 16,
  };
}

export function buildResponsesRequestBody(options: {
  model: string;
  history: ResponseHistoryItem[];
  tools: Tool[];
  extraParameters?: Record<string, any>;
}) {
  const instructions = options.history
    .filter((item) => item.role === "system" && typeof item.content === "string")
    .map((item) => (item.content as string).trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    model: options.model,
    instructions,
    input: toResponsesInput(options.history),
    stream: true,
    tools: buildResponsesTools(options.tools),
    ...(options.extraParameters || {}),
  };
}

export function applyResponsesEvent(
  state: ResponsesParseState,
  event: any,
): { content: string; reasoning: string } {
  const type = event?.type;
  let content = "";
  let reasoning = "";

  if (type === "response.output_text.delta" && typeof event.delta === "string") {
    content = event.delta;
    state.content += event.delta;
  } else if (
    (type === "response.reasoning_text.delta" ||
      type === "response.reasoning_summary_text.delta") &&
    typeof event.delta === "string"
  ) {
    reasoning = event.delta;
    state.reasoning += event.delta;
  } else if (type === "response.output_text.done" && typeof event.text === "string") {
    if (!state.content) {
      content = event.text;
      state.content = event.text;
    }
  } else if (type === "response.output_item.added" || type === "response.output_item.done") {
    rememberFunctionCall(state, event.item, event.output_index, type.endsWith(".done"));
  } else if (
    type === "response.function_call_arguments.delta" &&
    typeof event.delta === "string"
  ) {
    const call = findToolCall(state, event.item_id, event.output_index);
    if (call) {
      call.arguments += event.delta;
    }
  } else if (type === "response.completed") {
    state.completed = true;
    absorbCompletedResponse(state, event.response);
  } else if (type === "response.failed" || type === "error") {
    state.failedMessage =
      event.response?.error?.message ||
      event.error?.message ||
      event.message ||
      "Responses request failed.";
  }

  return { content, reasoning };
}

interface ResponseHistoryItem {
  role: string;
  content: any;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }> | null;
  tool_call_id?: string | null;
}

function toResponsesInput(history: ResponseHistoryItem[]) {
  const input: any[] = [];
  for (const item of history) {
    if (item.role === "system" || item.role === "reasoning") {
      continue;
    }

    if (item.role === "tool") {
      input.push({
        type: "function_call_output",
        call_id: item.tool_call_id,
        output: typeof item.content === "string" ? item.content : JSON.stringify(item.content ?? ""),
      });
      continue;
    }

    if (item.role === "assistant" && item.tool_calls?.length) {
      if (typeof item.content === "string" && item.content.trim()) {
        input.push(assistantMessage(item.content));
      }
      for (const call of item.tool_calls) {
        input.push({
          type: "function_call",
          call_id: call.id,
          name: call.function?.name || "",
          arguments: call.function?.arguments || "{}",
        });
      }
      continue;
    }

    if (item.role === "assistant" && typeof item.content === "string") {
      input.push(assistantMessage(item.content));
      continue;
    }

    if (item.role === "user" && typeof item.content === "string") {
      input.push({ role: "user", content: item.content });
      continue;
    }

    if (item.role === "user" && Array.isArray(item.content)) {
      input.push({
        role: "user",
        content: item.content.map(toResponsesContentPart).filter(Boolean),
      });
    }
  }
  return input;
}

function assistantMessage(text: string) {
  return {
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text }],
  };
}

function toResponsesContentPart(part: any) {
  if (part?.type === "text") {
    return { type: "input_text", text: part.text ?? "" };
  }
  if (part?.type === "image_url") {
    const url = typeof part.image_url === "string" ? part.image_url : part.image_url?.url;
    return url ? { type: "input_image", image_url: url } : null;
  }
  return null;
}

function buildResponsesTools(tools: Tool[]) {
  return tools.map((tool) => {
    const args = tool.arguments();
    return {
      type: "function",
      name: tool.name(),
      description: tool.description(),
      parameters: {
        type: "object",
        properties: args.reduce(
          (acc, arg) => {
            acc[arg.name] = {
              type: arg.type,
              description: `${arg.description}${arg.required ? " (required)" : ""}`,
              ...(arg.type === "array" ? { items: { type: "string" } } : {}),
            };
            return acc;
          },
          {} as Record<string, any>,
        ),
        required: args.filter((arg) => arg.required).map((arg) => arg.name),
      },
    };
  });
}

function rememberFunctionCall(
  state: ResponsesParseState,
  item: any,
  outputIndex: number | undefined,
  snapshot: boolean,
) {
  if (item?.type !== "function_call") {
    return;
  }
  const call =
    findToolCall(state, item.id, outputIndex) ||
    findToolCall(state, item.call_id, outputIndex);
  if (!call) {
    state.toolCalls.push({
      id: item.call_id || item.id || "",
      itemId: item.id || "",
      outputIndex: typeof outputIndex === "number" ? outputIndex : state.toolCalls.length,
      name: item.name || "",
      arguments: item.arguments || "",
    });
    return;
  }
  if (item.call_id) call.id = item.call_id;
  if (item.id) call.itemId = item.id;
  if (item.name) call.name = item.name;
  if (typeof outputIndex === "number") call.outputIndex = outputIndex;
  if (snapshot && typeof item.arguments === "string" && item.arguments) {
    call.arguments = item.arguments;
  } else if (!call.arguments && typeof item.arguments === "string") {
    call.arguments = item.arguments;
  }
}

function findToolCall(
  state: ResponsesParseState,
  itemId: string | undefined,
  outputIndex: number | undefined,
) {
  if (itemId) {
    const byId = state.toolCalls.find((call) => call.itemId === itemId || call.id === itemId);
    if (byId) return byId;
  }
  if (typeof outputIndex === "number") {
    return state.toolCalls.find((call) => call.outputIndex === outputIndex);
  }
  return undefined;
}

function absorbCompletedResponse(state: ResponsesParseState, response: any) {
  const output = Array.isArray(response?.output) ? response.output : [];
  output.forEach((item: any, index: number) => {
    if (item?.type === "function_call") {
      rememberFunctionCall(state, item, index, true);
      return;
    }
    if (item?.type !== "message" || state.content) {
      return;
    }
    const text = (item.content || [])
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
    if (text) {
      state.content = text;
    }
  });
}
