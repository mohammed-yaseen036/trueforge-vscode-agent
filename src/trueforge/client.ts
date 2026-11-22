import { StreamEvent } from "../types";

export class TrueForgeClient {
  private controller: AbortController | undefined;

  constructor(private readonly endpoint: string, private readonly agent: string) {}

  async *sendTurn(prompt: string, sessionId?: string): AsyncGenerator<StreamEvent> {
    this.controller = new AbortController();
    const response = await fetch(`${this.endpoint.replace(/\/$/, "")}/sessions/turns`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream" },
      body: JSON.stringify({ agent: this.agent, session_id: sessionId, prompt, stream: true }),
      signal: this.controller.signal
    });
    if (!response.ok) {
      throw new Error(`TrueForge returned HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error("TrueForge returned an empty stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const records = buffer.split("\n\n");
      buffer = records.pop() ?? "";
      for (const record of records) {
        const data = record.split("\n").find((line) => line.startsWith("data:"));
        if (!data) continue;
        const payload = data.slice(5).trim();
        if (payload === "[DONE]") {
          yield { type: "turn_done" };
          return;
        }
        try {
          yield this.normalizeEvent(JSON.parse(payload) as Record<string, unknown>);
        } catch {
          yield { type: "text_delta", text: payload };
        }
      }
    }
    yield { type: "turn_done" };
  }

  cancel(): void {
    this.controller?.abort();
    this.controller = undefined;
  }

  private normalizeEvent(event: Record<string, unknown>): StreamEvent {
    const type = String(event.type ?? event.event ?? "");
    if (type.includes("delta") || type === "text") {
      return { type: "text_delta", text: String(event.text ?? event.delta ?? "") };
    }
    if (type.includes("approval")) {
      return { type: "approval_required", path: String(event.path ?? "") };
    }
    if (type.includes("tool")) {
      if (type.includes("result")) {
        return { type: "tool_result", name: String(event.name ?? "tool"), result: event.result };
      }
      return { type: "tool_call", name: String(event.name ?? "tool"), args: event.args };
    }
    if (type.includes("error")) return { type: "error", message: String(event.message ?? "TrueForge error") };
    if (type.includes("done")) return { type: "turn_done" };
    return { type: "text_delta", text: String(event.text ?? "") };
  }
}
