import assert from "node:assert/strict";
import {
  applyStreamChoice,
  consumeSseBuffer,
  flushSseBuffer,
} from "../src/lib/llm_stream.ts";

function state() {
  return { requestedToolCalls: {}, finishReason: null };
}

const lateName = state();
applyStreamChoice(lateName, {
  delta: {
    tool_calls: [
      { index: 0, id: "call_1", function: { name: "", arguments: "" } },
    ],
  },
});
applyStreamChoice(lateName, {
  delta: {
    tool_calls: [
      {
        index: 0,
        function: { name: "run_shell_command", arguments: "{\"command\":\"ls logs\"}" },
      },
    ],
  },
  finish_reason: "tool_calls",
});
assert.equal(lateName.finishReason, "tool_calls");
assert.equal(lateName.requestedToolCalls[0].function.name, "run_shell_command");
assert.equal(
  lateName.requestedToolCalls[0].function.arguments,
  "{\"command\":\"ls logs\"}",
);

const fragments = state();
for (const name of ["run_", "shell_", "command"]) {
  applyStreamChoice(fragments, {
    delta: { tool_calls: [{ index: 0, function: { name } }] },
  });
}
assert.equal(fragments.requestedToolCalls[0].function.name, "run_shell_command");

const sameChunk = state();
applyStreamChoice(sameChunk, {
  delta: {
    tool_calls: [
      {
        index: 0,
        id: "call_2",
        function: { name: "get_terminal_lines", arguments: "{\"lines\":50}" },
      },
    ],
  },
  finish_reason: "tool_calls",
});
assert.equal(sameChunk.requestedToolCalls[0].function.name, "get_terminal_lines");
assert.equal(sameChunk.requestedToolCalls[0].id, "call_2");

const snapshot = state();
applyStreamChoice(snapshot, {
  delta: { tool_calls: [{ index: 0, id: "call_3", function: { arguments: "" } }] },
});
applyStreamChoice(snapshot, {
  message: {
    tool_calls: [
      {
        id: "call_3",
        type: "function",
        function: { name: "run_shell_command", arguments: "{\"command\":\"ls\"}" },
      },
    ],
  },
  finish_reason: "tool_calls",
});
assert.equal(snapshot.requestedToolCalls[0].function.name, "run_shell_command");
assert.equal(snapshot.requestedToolCalls[0].function.arguments, "{\"command\":\"ls\"}");

let rest = "";
let first = consumeSseBuffer(rest, 'data: {"a":');
rest = first.rest;
assert.deepEqual(first.events, []);
const second = consumeSseBuffer(rest, "1}\n");
assert.deepEqual(second.events, ['{"a":1}']);
assert.deepEqual(flushSseBuffer('data: {"b":2}'), ['{"b":2}']);
