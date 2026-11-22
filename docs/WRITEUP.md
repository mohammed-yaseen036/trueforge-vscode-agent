# Team

Syntax Sorcerers, one student.

# Starting point

This is a from-scratch VS Code extension. No upstream editor-agent source was copied.

# Architecture on TrueForge

The extension provides the editor UI and workspace safety boundary. A local TrueForge runtime owns the agent loop and model configuration. The planned local MCP server exposes repository inspection, search, staged-write, and command tools. Proposed writes are reviewed before application through VS Code workspace edits.

# How context is selected

The planned strategy is explicit mentions first, then agent-directed `repo_map`, targeted `search_code`, and ranged `read_file` calls. Injected context is budgeted, and the panel will show a Context plan before edits.

# Model setup

Models are configured inside TrueForge. This repository contains placeholders only and never contains provider credentials.

# Scorecard

| Criterion | Video timestamp | One-line claim |
|---|---|---|
| A1 Inline edit | TODO | TODO after rehearsal |
| A2 Agent mode | TODO | TODO after rehearsal |
| A3 Streaming/cancel | TODO | TODO after rehearsal |
| B1 Context assembly | TODO | TODO after rehearsal |
| B2 Diff safety | TODO | TODO after rehearsal |
| B3 Resilience | TODO | TODO after rehearsal |
| B4 TrueForge depth | TODO | TODO after rehearsal |

# Tools used

- VS Code / Antigravity
- TrueForge
- Node.js and TypeScript

# Known limitations and what I would do with another month

The initial implementation slice is not yet a complete demo: the exact TrueForge API contract still needs verification, and MCP transport, approval-driven hunk review, fallback retries, and Flask rehearsal remain. With another month I would add integration tests against a pinned TrueForge runtime and robust protocol/version negotiation.
