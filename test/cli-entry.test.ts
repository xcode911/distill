import { describe, expect, it } from "bun:test";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import cliPackage from "../packages/cli/package.json";
import { createScriptCommand } from "./script-command";

const root = path.resolve(import.meta.dir, "..");
const cli = path.join(root, "src", "cli.ts");
const itUnixOnly = process.platform === "win32" ? it.skip : it;

describe("cli entrypoint", () => {
  it("prints help", () => {
    const result = spawnSync("bun", ["run", cli, "--help"], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('cmd 2>&1 | distill "question"');
  });

  it("prints the version", () => {
    const result = spawnSync("bun", ["run", cli, "--version"], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(cliPackage.version);
  });

  it("fails on unsupported platforms", () => {
    const launcher = JSON.stringify(path.join(root, "packages", "cli", "bin", "distill.js"));
    const result = spawnSync(
      "node",
      [
        "-e",
        `Object.defineProperty(process, "platform", { value: "haiku" }); Object.defineProperty(process, "arch", { value: "x64" }); require(${launcher});`
      ],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("[distill] Unsupported platform: haiku/x64.");
  });

  itUnixOnly("fails without stdin when attached to a tty", () => {
    const scriptCommand = createScriptCommand("/dev/null", "bun", [
      "run",
      cli,
      "is this safe?"
    ]);
    const result = spawnSync(scriptCommand.command, scriptCommand.args, {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(2);
    expect(`${result.stdout}${result.stderr}`).toContain("stdin is required.");
  });

  it("persists config commands", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "distill-cli-config-"));
    const configPath = path.join(dir, "config.json");

    try {
      const setModel = spawnSync(
        "bun",
        ["run", cli, "config", "model", "qwen3.5:2b"],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            DISTILL_CONFIG_PATH: configPath
          }
        }
      );

      const setThinking = spawnSync(
        "bun",
        ["run", cli, "config", "thinking", "false"],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            DISTILL_CONFIG_PATH: configPath
          }
        }
      );

      expect(setModel.status).toBe(0);
      expect(setThinking.status).toBe(0);
      expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({
        model: "qwen3.5:2b",
        thinking: false
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  itUnixOnly("falls back to the workspace binary when the platform package is not installed", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "distill-workspace-fallback-"));
    const fakeTargetDir = path.join(
      dir,
      "packages",
      `distill-${process.platform}-${process.arch}`,
      "bin"
    );
    const launcherPath = path.join(dir, "packages", "cli", "bin", "distill.js");
    const fakeBinaryPath = path.join(fakeTargetDir, "distill");

    try {
      await mkdir(path.dirname(launcherPath), { recursive: true });
      await mkdir(fakeTargetDir, { recursive: true });
      await copyFile(path.join(root, "packages", "cli", "bin", "distill.js"), launcherPath);
      await writeFile(
        fakeBinaryPath,
        "#!/bin/sh\nprintf 'workspace fallback\\n'\n"
      );
      await chmod(fakeBinaryPath, 0o755);

      const result = spawnSync("node", [launcherPath, "--version"], {
        cwd: dir,
        encoding: "utf8"
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("workspace fallback\n");
      expect(result.stderr).toBe("");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
