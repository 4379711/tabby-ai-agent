import assert from "node:assert/strict";
import {
  buildChatCompletionsUrl,
  buildCheckpointRequestBody,
  buildResponsesUrl,
  normalizeOpenAIBaseUrl,
} from "../src/lib/llm_endpoint.ts";

assert.deepEqual(buildCheckpointRequestBody("deepseek-v4-flash"), {
  model: "deepseek-v4-flash",
  messages: [
    {
      role: "user",
      content: "Validate this endpoint.",
    },
  ],
  stream: false,
  max_tokens: 1,
});

assert.equal(
  normalizeOpenAIBaseUrl("https://api.deepseek.com"),
  "https://api.deepseek.com",
);
assert.equal(
  normalizeOpenAIBaseUrl("https://api.deepseek.com/"),
  "https://api.deepseek.com",
);
assert.equal(
  normalizeOpenAIBaseUrl("https://api.deepseek.com/v1"),
  "https://api.deepseek.com",
);
assert.equal(
  normalizeOpenAIBaseUrl("https://api.deepseek.com/v1/"),
  "https://api.deepseek.com",
);
assert.equal(
  normalizeOpenAIBaseUrl("https://api.deepseek.com/v1/chat/completions"),
  "https://api.deepseek.com",
);

assert.equal(
  buildChatCompletionsUrl("https://api.deepseek.com"),
  "https://api.deepseek.com/v1/chat/completions",
);
assert.equal(
  buildChatCompletionsUrl("https://api.deepseek.com/v1"),
  "https://api.deepseek.com/v1/chat/completions",
);
assert.equal(
  buildChatCompletionsUrl("https://api.deepseek.com/v1/chat/completions"),
  "https://api.deepseek.com/v1/chat/completions",
);
assert.equal(
  normalizeOpenAIBaseUrl("https://api.ofox.ai/v1/responses"),
  "https://api.ofox.ai",
);
assert.equal(
  buildResponsesUrl("https://api.ofox.ai/v1"),
  "https://api.ofox.ai/v1/responses",
);

console.log("llm_endpoint tests passed");
