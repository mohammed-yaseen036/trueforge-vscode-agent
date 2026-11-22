import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { exec } from "node:child_process";
import * as vscode from "vscode";
import { StagingStore } from "../diff/staging";

type JsonRpcRequest = { id?: string | number; method?: string; params?: Record<string, unknown> };

export class EditorToolServer {
  private server: http.Server | undefined;

  constructor(private readonly staging: StagingStore) {}

  async start(port: number): Promise<void> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) throw new Error("Open a workspace before starting the editor tool server");
    this.server = http.createServer((request, response) => {
      void this.handle(request, response, root);
    });
    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(port, "127.0.0.1", resolve);
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve, reject) => this.server?.close((error) => error ? reject(error) : resolve()));
    this.server = undefined;
  }

  private async handle(request: http.IncomingMessage, response: http.ServerResponse, root: string): Promise<void> {
    response.setHeader("content-type", "application/json");
    if (request.method !== "POST") {
      response.statusCode = 405;
      response.end(JSON.stringify({ error: "POST required" }));
      return;
    }
    try {
      const body = await this.readBody(request);
      const rpc = JSON.parse(body) as JsonRpcRequest;
      const result = await this.call(rpc.method ?? "", rpc.params ?? {}, root);
      response.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id ?? null, result }));
    } catch (error) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  }

  private async call(method: string, params: Record<string, unknown>, root: string): Promise<unknown> {
    switch (method) {
      case "tools/list":
        return { tools: ["repo_map", "search_code", "read_file", "propose_write", "run_command"] };
      case "repo_map":
        return this.repoMap(root);
      case "search_code":
        return this.searchCode(root, String(params.query ?? ""), String(params.glob ?? "**/*"));
      case "read_file":
        return this.readFile(root, String(params.path ?? ""), Number(params.startLine ?? 1), Number(params.endLine ?? 300));
      case "propose_write":
        return this.proposeWrite(root, String(params.path ?? ""), String(params.newContent ?? ""), String(params.rationale ?? ""));
      case "run_command":
        return this.runCommand(root, String(params.command ?? ""), String(params.cwd ?? "."));
      default:
        throw new Error(`Unknown editor tool: ${method}`);
    }
  }

  private async repoMap(root: string): Promise<string> {
    const files = await vscode.workspace.findFiles("**/*", "{**/.git/**,**/node_modules/**,**/__pycache__/**,**/.venv/**,**/dist/**}");
    return files.map((uri) => path.relative(root, uri.fsPath).replaceAll("\\", "/")).sort().slice(0, 500).join("\n");
  }

  private async searchCode(root: string, query: string, glob: string): Promise<string[]> {
    const files = await vscode.workspace.findFiles(glob, "{**/.git/**,**/node_modules/**,**/dist/**}");
    const results: string[] = [];
    for (const uri of files) {
      const text = await fs.readFile(uri.fsPath, "utf8").catch(() => "");
      const lines = text.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase()) && results.length < 10) {
          results.push(`${path.relative(root, uri.fsPath).replaceAll("\\", "/")}:${index + 1}: ${line.trim()}`);
        }
      });
    }
    return results;
  }

  private async readFile(root: string, relative: string, startLine: number, endLine: number): Promise<string> {
    const file = this.safePath(root, relative);
    const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/).slice(Math.max(startLine - 1, 0), Math.min(endLine, startLine + 299));
    return lines.map((line, index) => `${startLine + index}: ${line}`).join("\n");
  }

  private async proposeWrite(root: string, relative: string, proposed: string, rationale: string): Promise<{ status: string; path: string }> {
    const file = this.safePath(root, relative);
    const original = await fs.readFile(file, "utf8").catch(() => "");
    this.staging.stage({ path: relative.replaceAll("\\", "/"), original, proposed, rationale });
    return { status: "staged", path: relative.replaceAll("\\", "/") };
  }

  private async runCommand(root: string, command: string, cwd: string): Promise<string> {
    if (/\b(rm\s+-rf|git\s+reset\s+--hard|git\s+clean|format\s+[a-z]:|del\s+\/s)\b/i.test(command)) {
      throw new Error("Potentially destructive command blocked");
    }
    return new Promise((resolve, reject) => exec(command, { cwd: this.safePath(root, cwd), timeout: 60000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(new Error(`${error.message}\n${stderr}`));
      else resolve((stdout + stderr).slice(-4096));
    }));
  }

  private safePath(root: string, relative: string): string {
    if (path.isAbsolute(relative)) throw new Error("Absolute paths are not allowed");
    const resolved = path.resolve(root, relative);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error("Path escapes workspace");
    return resolved;
  }

  private async readBody(request: http.IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  }
}
