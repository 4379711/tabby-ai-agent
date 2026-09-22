import assert from "node:assert/strict";
import {
  applyResponsesEvent,
  buildResponsesRequestBody,
  createResponsesParseState,
} from "../src/lib/llm_responses.ts";
const body = buildResponsesRequestBody({
  model: "openai/gpt-5.6-terra",
  history: [
    { role: "system", content: "Be careful." },
    { role: "user", content: "Check logs" },
  ],
  tools: [],
  extraParameters: { reasoning: { effort: "high" } },
});

assert.equal(body.instructions, "Be careful.");
assert.deepEqual(body.input, [{ role: "user", content: "Check logs" }]);
assert.deepEqual(body.reasoning, { effort: "high" });
assert.equal(body.model, "openai/gpt-5.6-terra");

const state = createResponsesParseState();
applyResponsesEvent(state, {
  type: "response.output_item.added",
  output_index: 0,
  item: { type: "function_call", id: "fc_1", call_id: "call_1", name: "run_shell_command", arguments: "" },
});
applyResponsesEvent(state, {
  type: "response.function_call_arguments.delta",
  item_id: "fc_1",
  output_index: 0,
  delta: "{\"command\":\"ls\"}",
});
assert.equal(state.toolCalls[0].name, "run_shell_command");
assert.equal(state.toolCalls[0].id, "call_1");
assert.equal(state.toolCalls[0].arguments, "{\"command\":\"ls\"}");

console.log("llm_responses tests passed");
