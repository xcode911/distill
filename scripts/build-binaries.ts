import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const targets = [
  {
    key: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    output: ".dist/bun-darwin-arm64/distill"
  },
  {
    key: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    output: ".dist/bun-darwin-x64/distill"
  },
  {
    key: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    output: ".dist/bun-linux-arm64/distill"
  },
  {
    key: "linux-x64",
    bunTarget: "bun-linux-x64",
    output: ".dist/bun-linux-x64/distill"
  },
  {
    key: "win32-x64",
    bunTarget: "bun-windows-x64",
    output: ".dist/bun-windows-x64/distill.exe"
  }
] as const;

const root = path.resolve(import.meta.dir, "..");
const entrypoint = path.join(root, "src", "cli.ts");
const currentTargetKey = `${process.platform}-${process.arch}`;
const selectedTargets =
  process.env.DISTILL_BUILD_ALL === "1"
    ? targets
    : targets.filter((target) => target.key === currentTargetKey);

if (selectedTargets.length === 0) {
  throw new Error(`Unsupported build target for this machine: ${currentTargetKey}.`);
}

for (const target of selectedTargets) {
  const outfile = path.join(root, target.output);
  await mkdir(path.dirname(outfile), { recursive: true });

  const result = spawnSync(
    "bun",
    [
      "build",
      "--compile",
      `--target=${target.bunTarget}`,
      `--outfile=${outfile}`,
      entrypoint
    ],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  if (result.status !== 0) {
    throw new Error(`Failed to compile ${target.bunTarget}.`);
  }
}
