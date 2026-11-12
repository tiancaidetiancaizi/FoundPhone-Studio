import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

// 发布目录必须独立于工程目录（原目录的应用被删后无法再次发布），
// 每次改完内容执行：npm run build && npm run publish:sync，然后再发布。
const src = resolve("dist");
const dest = resolve("../FoundPhone-Publish");

mkdirSync(dest, { recursive: true });
for (const entry of readdirSync(dest)) {
  if (entry.startsWith(".workbuddy") || entry.endsWith(".genie")) continue;
  rmSync(join(dest, entry), { recursive: true, force: true });
}
cpSync(src, dest, { recursive: true });
console.log("已同步 dist → FoundPhone-Publish");
