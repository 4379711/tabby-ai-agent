# Tabby AI Agent Plus

This package is a fork of [tabby-ai-agent](https://github.com/jvit/tabby-ai-agent). The original MIT license and copyright notice are unchanged.

<p align="center">
	<img src="https://raw.githubusercontent.com/jvit/tabby-ai-agent/main/screenshot.png" alt="Tabby AI Agent screenshot" width="50%">
</p>

Tabby AI Agent adds an AI assistant panel directly inside [Tabby](https://tabby.sh/). It can handle terminal tasks more autonomously, execute shell commands, and help you understand terminal output without leaving your active terminal tab.

It is built for terminal workflows where you want AI help, but still want command execution to stay visible and reviewable.

## Safety and disclaimer

Giving an AI agent access to your terminal is inherently risky. If you use it without care, it can run destructive commands, change files, or damage your system or data, so review its actions carefully and use auto-approval sparingly.

You are responsible for how you use this plugin. The plugin and its authors are not responsible for damage, data loss, or other consequences caused by unsafe, incorrect, or careless use.

## What it does

- Adds an **AI Chat** side panel to terminal tabs.
- Uses recent terminal output as context.
- Answers questions about the current terminal session.
- Can act autonomously and **execute shell commands** in the active terminal.
- Shows each proposed command with its risk level, explanation, and estimated runtime.
- Supports manual approval, with optional auto-approval for low-risk commands.
- Connects to OpenAI-compatible endpoints, including local and **self-hosted** services.
- Supports extra request parameters for providers such as LiteLLM, llama.cpp, and vLLM.

## Using the plugin

You can configure the plugin in Tabby's settings.

Inside terminal, open the AI Agent panel using the **AI Agent** button in the toolbar.

You can also toggle the panel with the keyboard shortcut:

- **Windows and Linux:** `Ctrl+Alt+A`
- **macOS:** `Cmd+Shift+A`

## Privacy Warning

Prefer self-hosting. Third-party AI services may collect your terminal commands, logs, and file paths. Be wary of "privacy promises" from large providers; their incentives, data collection and model training, are rarely aligned with your own. While self-hosting requires more setup, it ensures you set the rules for your data rather than hoping a vendor follows theirs.

## License

MIT
