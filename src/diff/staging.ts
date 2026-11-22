import * as vscode from "vscode";
import { StagedChange } from "../types";

export class StagingStore {
  private readonly changes = new Map<string, StagedChange>();

  stage(change: StagedChange): void {
    this.changes.set(change.path, change);
  }

  list(): StagedChange[] {
    return [...this.changes.values()];
  }

  clear(): void {
    this.changes.clear();
  }

  async applyAccepted(paths: string[]): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    for (const path of paths) {
      const change = this.changes.get(path);
      if (!change) continue;
      const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri ?? vscode.Uri.file(path), path);
      const document = await vscode.workspace.openTextDocument(uri);
      edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), change.proposed);
    }
    if (!(await vscode.workspace.applyEdit(edit))) {
      throw new Error("VS Code rejected the staged workspace edit");
    }
    for (const path of paths) this.changes.delete(path);
  }
}
