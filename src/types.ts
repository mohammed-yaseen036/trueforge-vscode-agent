export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "approval_required"; path: string }
  | { type: "turn_done" }
  | { type: "error"; message: string };

export interface StagedChange {
  path: string;
  original: string;
  proposed: string;
  rationale: string;
}
