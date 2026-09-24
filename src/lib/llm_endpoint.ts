export interface CheckpointRequestBody {
  model: string;
  messages: Array<{
    role: "user";
    content: string;
  }>;
  stream: false;
  max_tokens: 1;
}

export function normalizeOpenAIBaseUrl(baseUrl: string): string {
  let normalized = baseUrl.trim();
  normalized = normalized.replace(/\/v1\/chat\/completions\/?$/i, "");
  normalized = normalized.replace(/\/v1\/responses\/?$/i, "");
  normalized = normalized.replace(/\/v1\/?$/i, "");
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  return `${normalizeOpenAIBaseUrl(baseUrl)}/v1/chat/completions`;
}

export function buildResponsesUrl(baseUrl: string): string {
  return `${normalizeOpenAIBaseUrl(baseUrl)}/v1/responses`;
}

export function buildCheckpointRequestBody(
  model = "",
): CheckpointRequestBody {
  return {
    model,
    messages: [
      {
        role: "user",
        content: "Validate this endpoint.",
      },
    ],
    stream: false,
    max_tokens: 1,
  };
}
