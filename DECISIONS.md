# Decisions

## 2026-11-22

- The project is built from scratch as a VS Code extension; no upstream editor code is copied.
- The extension uses a configurable local TrueForge HTTP endpoint and does not call a model provider directly.
- The current client expects a streaming `POST /sessions/turns` endpoint and normalizes SSE records into typed extension events. Exact endpoint and approval payload names remain a Phase 1 verification item against the installed TrueForge SDK/OpenAPI.
- The initial slice prioritizes activation, a visible agent panel, streaming text/tool events, cancellation, and a typed staging boundary before adding full MCP transport and hunk-level approval UI.
- Node v24.19.0 is installed, satisfying the plan's Node >= 22.14 requirement.
