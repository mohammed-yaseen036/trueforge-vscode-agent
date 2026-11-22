import * as vscode from "vscode";
import { TrueForgeClient } from "../trueforge/client";
import { StagingStore } from "../diff/staging";

export class AgentPanel implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private client: TrueForgeClient | undefined;
  private sessionId: string | undefined;

  constructor(private readonly staging: StagingStore) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.html();
    view.webview.onDidReceiveMessage(async (message: { type: string; prompt?: string }) => {
      if (message.type === "send" && message.prompt?.trim()) await this.send(message.prompt.trim());
      if (message.type === "cancel") this.client?.cancel();
    });
  }

  open(): void {
    void vscode.commands.executeCommand("workbench.view.extension.trueforge");
  }

  cancel(): void {
    this.client?.cancel();
  }

  async send(prompt: string): Promise<void> {
    const config = vscode.workspace.getConfiguration("trueforge");
    this.client = new TrueForgeClient(config.get("endpoint", "http://127.0.0.1:8787"), config.get("agent", "coding-agent"));
    this.post({ type: "status", value: "working" });
    try {
      for await (const event of this.client.sendTurn(prompt, this.sessionId)) {
        if (event.type === "text_delta") this.post({ type: "text", value: event.text });
        else if (event.type === "tool_call") this.post({ type: "tool", value: `${event.name} ${JSON.stringify(event.args)}` });
        else if (event.type === "approval_required") this.post({ type: "approval", value: event.path });
        else if (event.type === "error") this.post({ type: "error", value: event.message });
      }
    } catch (error) {
      this.post({ type: "error", value: error instanceof Error ? error.message : String(error) });
    } finally {
      this.post({ type: "status", value: "idle" });
    }
  }

  private post(message: unknown): void {
    void this.view?.webview.postMessage(message);
  }

  private html(): string {
    return `<!doctype html><html><body>
      <style>body{font-family:var(--vscode-font-family);padding:8px}.log{white-space:pre-wrap;max-height:70vh;overflow:auto}.row{display:flex;gap:4px}textarea{flex:1;min-height:60px}button{margin-top:4px}</style>
      <div id="log" class="log"></div><div class="row"><textarea id="prompt" placeholder="Ask TrueForge to inspect or change the workspace"></textarea></div>
      <button id="send">Send</button><button id="cancel">Cancel</button>
      <script>
        const vscode=acquireVsCodeApi(), log=document.getElementById('log');
        const add=(text)=>{log.textContent+=text;log.scrollTop=log.scrollHeight};
        document.getElementById('send').onclick=()=>{const p=document.getElementById('prompt');if(p.value.trim()){add('\\n> '+p.value+'\\n');vscode.postMessage({type:'send',prompt:p.value});p.value=''}};
        document.getElementById('cancel').onclick=()=>vscode.postMessage({type:'cancel'});
        window.addEventListener('message',e=>{const m=e.data;if(m.type==='text')add(m.value);else if(m.type==='tool')add('\\n[tool] '+m.value+'\\n');else if(m.type==='approval')add('\\n[approval] '+m.value+'\\n');else if(m.type==='error')add('\\n[error] '+m.value+'\\n');});
      </script></body></html>`;
  }
}
