import { chmod, copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const targets = [
  {
    key: "darwin-arm64",
    source: ".dist/bun-darwin-arm64/distill",
    destination: "packages/distill-darwin-arm64/bin/distill"
  },
  {
    key: "darwin-x64",
    source: ".dist/bun-darwin-x64/distill",
    destination: "packages/distill-darwin-x64/bin/distill"
  },
  {
    key: "linux-arm64",
    source: ".dist/bun-linux-arm64/distill",
    destination: "packages/distill-linux-arm64/bin/distill"
  },
  {
    key: "linux-x64",
    source: ".dist/bun-linux-x64/distill",
    destination: "packages/distill-linux-x64/bin/distill"
  },
  {
    key: "win32-x64",
    source: ".dist/bun-windows-x64/distill.exe",
    destination: "packages/distill-win32-x64/bin/distill.exe"
  }
] as const;

const root = path.resolve(import.meta.dir, "..");
const currentTargetKey = `${process.platform}-${process.arch}`;
const selectedTargets =
  process.env.DISTILL_BUILD_ALL === "1"
    ? targets
    : targets.filter((target) => target.key === currentTargetKey);

if (selectedTargets.length === 0) {
  throw new Error(`Unsupported sync target for this machine: ${currentTargetKey}.`);
}

for (const target of selectedTargets) {
  const source = path.join(root, target.source);
  const destination = path.join(root, target.destination);

  await stat(source);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);

  if (!destination.endsWith(".exe")) {
    await chmod(destination, 0o755);
  }
}
