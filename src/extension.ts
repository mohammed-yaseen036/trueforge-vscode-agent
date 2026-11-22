import * as vscode from "vscode";
import { AgentPanel } from "./ui/panel";
import { StagingStore } from "./diff/staging";
import { EditorToolServer } from "./mcp/server";

export function activate(context: vscode.ExtensionContext): void {
  const staging = new StagingStore();
  const toolServer = new EditorToolServer(staging);
  const panel = new AgentPanel(staging);
  const port = vscode.workspace.getConfiguration("trueforge").get("mcpPort", 4318);
  void toolServer.start(port).catch((error: unknown) => {
    void vscode.window.showErrorMessage(`TrueForge editor tools failed to start: ${error instanceof Error ? error.message : String(error)}`);
  });
  context.subscriptions.push(
    { dispose: () => { void toolServer.stop(); } },
    vscode.window.registerWebviewViewProvider("trueforge.agentView", panel),
    vscode.commands.registerCommand("trueforge.openPanel", () => panel.open()),
    vscode.commands.registerCommand("trueforge.cancel", () => panel.cancel()),
    vscode.commands.registerCommand("trueforge.undoLastApply", () => vscode.commands.executeCommand("undo")),
    vscode.commands.registerCommand("trueforge.inlineEdit", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        void vscode.window.showInformationMessage("Select code before starting an inline edit.");
        return;
      }
      const instruction = await vscode.window.showInputBox({ prompt: "Describe the inline edit" });
      if (!instruction) return;
      const relative = vscode.workspace.asRelativePath(editor.document.uri);
      await panel.send(`Inline edit ${relative}, lines ${editor.selection.start.line + 1}-${editor.selection.end.line + 1}. Instruction: ${instruction}\nSelected text:\n${editor.document.getText(editor.selection)}`);
      panel.open();
    })
  );
}

export function deactivate(): void {}
