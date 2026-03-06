import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import cliPackage from "../packages/cli/package.json";

const root = path.resolve(import.meta.dir, "..");
const cli = path.join(root, "src", "cli.ts");

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

  it("fails without stdin when attached to a tty", () => {
    const result = spawnSync(
      "script",
      ["-q", "/dev/null", "bun", "run", cli, "is this safe?"],
      {
        cwd: root,
        encoding: "utf8"
      }
    );

    expect(result.status).toBe(2);
    expect(result.stdout).toContain("stdin is required.");
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
});
