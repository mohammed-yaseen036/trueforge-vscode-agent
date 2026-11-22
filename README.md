# TrueForge VS Code Agent

TrueForge VS Code Agent is a from-scratch VS Code extension that delegates coding-agent work to a local [TrueForge](https://github.com/truefoundry/trueforge) runtime. The extension owns the editor UX and workspace safety boundary; TrueForge owns model selection and agent execution.

## Status

The first development slice is complete: the extension builds, activates a TrueForge panel, streams SSE text/tool events, supports cancellation, and contains a typed staged-change boundary. TrueForge API names, the local MCP transport, approval-driven diff review, resilience fallback, and the Flask rehearsal remain to be implemented and verified.

## Prerequisites

- Node.js >= 22.14
- VS Code or Antigravity
- Git
- A local TrueForge installation/configuration

## Development

```powershell
npm install
npm run build
```

Press `F5` in VS Code to launch an Extension Development Host. Open **TrueForge: Open Agent** from the Command Palette.

Configure the local runtime in VS Code settings:

```json
{
  "trueforge.endpoint": "http://127.0.0.1:8787",
  "trueforge.agent": "coding-agent",
  "trueforge.fallbackAgent": ""
}
```

## TrueForge setup

1. Start TrueForge locally with `npx @truefoundry/trueforge@latest`.
2. Configure models inside TrueForge; do not put provider keys in this repository.
3. Load the agent definition and system prompt from `trueforge/`.
4. Register the local editor MCP server when its transport is enabled.
5. Set the endpoint and agent alias in VS Code settings.

## Planned demo

The target rehearsal uses Flask 3.1.3 at commit `22d92470` and follows the exact Task A, Task B, and Task C instructions in the project plan. Until the remaining phases are implemented, the README deliberately does not claim that those tasks pass end to end.

## License

MIT. The project is built from scratch.
