import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

let cachedVersion = null;

export async function getPackageVersion() {
  if (cachedVersion) {
    return cachedVersion;
  }
  const here = fileURLToPath(import.meta.url);
  const pkgPath = path.join(path.dirname(path.dirname(path.dirname(here))), "package.json");
  const raw = await fs.readFile(pkgPath, "utf8");
  const pkg = JSON.parse(raw);
  cachedVersion = pkg.version || "0.0.0";
  return cachedVersion;
}
