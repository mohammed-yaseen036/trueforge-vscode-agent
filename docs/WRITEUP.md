# 1. Team

Syntax Sorcerers, one student.

# 2. Starting point

This is a from-scratch VS Code extension. No upstream editor-agent source was copied.

# 3. Architecture on TrueForge

The extension provides the editor UI and workspace safety boundary. A local TrueForge runtime owns the agent loop and model configuration. The extension includes a local HTTP editor-tool server on `127.0.0.1:4318` with `repo_map`, `search_code`, `read_file`, `propose_write`, and `run_command`. Proposed writes enter a staging store and are not written directly by the tool server. The panel consumes streamed SSE events and supports aborting the active request.

# 4. How context is selected

The intended strategy is explicit mentions first, then agent-directed `repo_map`, targeted `search_code`, and ranged `read_file` calls. The system prompt requires the agent to read before editing and print a Context plan. The current tool server caps individual reads at 300 lines and search results at 10 matches. Full token-budget enforcement and Context-plan rendering are next implementation steps; they are not claimed as complete in this submission.

# 5. Model setup

Models are configured inside TrueForge, which is addressed through a configurable local endpoint. The repository contains placeholder model configuration only and no provider credentials. The extension does not contain a direct OpenAI, Anthropic, or Gemini client.

# 6. Scorecard

No demo video has been recorded yet, so timestamps are intentionally marked as not recorded rather than overstated.

| Criterion | Video timestamp | Evidence / claim |
|---|---|---|
| A1 Inline edit | Not recorded | Command and selection prompt are scaffolded; end-to-end Flask verification is pending. |
| A2 Agent mode | Not recorded | Streaming panel and editor tools exist; multi-file approval rehearsal is pending. |
| A3 Streaming/cancel | Not recorded | SSE abort is implemented in the client and panel; timing still needs integration testing. |
| B1 Context assembly | Not recorded | Ranged reads, search, repo map, and system-prompt guidance are implemented; budget UI is pending. |
| B2 Diff safety | Not recorded | Staging boundary exists; hunk-level review and undo persistence are pending. |
| B3 Resilience | Not recorded | Fallback setting exists; retry and automatic fallback state machine are pending. |
| B4 TrueForge depth | Not recorded | Local editor-tool boundary and TrueForge client are implemented; exact runtime contract remains to be verified. |

# 7. Tools used

- VS Code / Antigravity
- TrueForge
- Node.js and TypeScript
- GitHub
- Google Forms for submission

# 8. Known limitations and what I would do with another month

This is the initial working slice, not a finished demo: the exact TrueForge API contract still needs verification, the current HTTP tool endpoint needs to be aligned with the runtime's supported MCP transport, and approval-driven hunk review, fallback retries, and Flask rehearsal remain. With another month I would pin a TrueForge runtime for integration tests, add protocol/version negotiation, complete atomic multi-file review and undo persistence, and run all three required Flask tasks on a clean checkout.
