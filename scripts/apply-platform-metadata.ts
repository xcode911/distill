import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const targets = [
  {
    packagePath: "packages/distill-darwin-arm64/package.json",
    os: ["darwin"],
    cpu: ["arm64"]
  },
  {
    packagePath: "packages/distill-darwin-x64/package.json",
    os: ["darwin"],
    cpu: ["x64"]
  },
  {
    packagePath: "packages/distill-linux-arm64/package.json",
    os: ["linux"],
    cpu: ["arm64"]
  },
  {
    packagePath: "packages/distill-linux-x64/package.json",
    os: ["linux"],
    cpu: ["x64"]
  },
  {
    packagePath: "packages/distill-win32-x64/package.json",
    os: ["win32"],
    cpu: ["x64"]
  }
] as const;

for (const target of targets) {
  const packageJsonPath = path.join(root, target.packagePath);
  const current = JSON.parse(
    await readFile(packageJsonPath, "utf8")
  ) as Record<string, unknown>;

  current.os = [...target.os];
  current.cpu = [...target.cpu];

  await writeFile(packageJsonPath, `${JSON.stringify(current, null, 2)}\n`);
}
