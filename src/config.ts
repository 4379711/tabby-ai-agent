import { ConfigProvider, Platform } from "tabby-core";

export type AIProvider = "openrouter" | "litellm";
export type PanelPosition = "left" | "right" | "top" | "bottom";
export type ApiStyle = "completions" | "responses";

export interface ApiProfileConfig {
  llmEndpoint: string;
  apiToken: string;
  model: string;
  additionalRequestParametersText: string;
  additionalRequestParameters: Record<string, any>;
  additionalSystemPrompt: string;
}

export interface AIAgentConfig {
  apiStyle: ApiStyle;
  apiProfilesReady: boolean;
  completions: ApiProfileConfig;
  responses: ApiProfileConfig;
  llmEndpoint: string;
  apiToken: string;
  model: string;
  autoApproveLowRiskCommands: boolean;
  additionalRequestParametersText: string;
  additionalRequestParameters: Record<string, any>;
  additionalSystemPrompt: string;
  panelPosition: PanelPosition;
  panelSizePercent: number;
  hideTerminalOutput: boolean;
}

export function emptyApiProfile(): ApiProfileConfig {
  return {
    llmEndpoint: "",
    apiToken: "",
    model: "",
    additionalRequestParametersText: "",
    additionalRequestParameters: {},
    additionalSystemPrompt: "",
  };
}

export function ensureAiAgentProfiles(aiAgent: any): boolean {
  if (!aiAgent) {
    return false;
  }

  const style: ApiStyle = aiAgent.apiStyle === "responses" ? "responses" : "completions";
  if (aiAgent.apiStyle === style) {
    return false;
  }

  aiAgent.apiStyle = style;
  return true;
}

export function getActiveProfile(aiAgent: any): ApiProfileConfig {
  return {
    llmEndpoint: typeof aiAgent?.llmEndpoint === "string" ? aiAgent.llmEndpoint : "",
    apiToken: typeof aiAgent?.apiToken === "string" ? aiAgent.apiToken : "",
    model: typeof aiAgent?.model === "string" ? aiAgent.model : "",
    additionalRequestParametersText:
      typeof aiAgent?.additionalRequestParametersText === "string"
        ? aiAgent.additionalRequestParametersText
        : "",
    additionalRequestParameters: isPlainObject(aiAgent?.additionalRequestParameters)
      ? aiAgent.additionalRequestParameters
      : {},
    additionalSystemPrompt:
      typeof aiAgent?.additionalSystemPrompt === "string" ? aiAgent.additionalSystemPrompt : "",
  };
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class AIAgentConfigProvider extends ConfigProvider {
  defaults = {
    aiAgent: {
      apiStyle: "completions" as ApiStyle,
      apiProfilesReady: false,
      completions: { __nonStructural: true, ...emptyApiProfile() },
      responses: { __nonStructural: true, ...emptyApiProfile() },
      llmEndpoint: "",
      apiToken: "",
      model: "",
      autoApproveLowRiskCommands: false,
      additionalRequestParametersText: "",
      additionalRequestParameters: {},
      additionalSystemPrompt: "",
      panelPosition: "right" as PanelPosition,
      panelSizePercent: 40,
      hideTerminalOutput: false,
    },
    hotkeys: {
      "toggle-ai-agent-panel": ["Ctrl-Alt-A"],
      "stop-ai-agent-response": ["Ctrl-Alt-S"],
      "approve-ai-agent-command": ["Ctrl-Alt-Enter"],
      "decline-ai-agent-command": ["Ctrl-Alt-Backspace"],
      "clear-ai-agent-chat": ["Ctrl-Alt-C"],
      "force-read-terminal": ["Ctrl-Alt-P"],
    },
  };

  platformDefaults = {
    [Platform.macOS]: {
      hotkeys: {
        "toggle-ai-agent-panel": ["Cmd-Shift-A"],
        "stop-ai-agent-response": ["Ctrl-Alt-S"],
        "approve-ai-agent-command": ["Cmd-Shift-Enter"],
        "decline-ai-agent-command": ["Cmd-Shift-Backspace"],
        "clear-ai-agent-chat": ["Cmd-Shift-C"],
        "force-read-terminal": ["Cmd-Shift-P"],
      },
    },
  };
}
