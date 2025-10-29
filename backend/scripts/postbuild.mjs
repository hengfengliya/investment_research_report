import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, "..");
const projectRoot = resolve(backendRoot, "..");
const distNodeModules = resolve(backendRoot, "dist", "node_modules");

const sources = [
  {
    src: resolve(projectRoot, "node_modules", ".prisma"),
    dest: resolve(distNodeModules, ".prisma"),
  },
  {
    src: resolve(projectRoot, "node_modules", "@prisma"),
    dest: resolve(distNodeModules, "@prisma"),
  },
];

mkdirSync(distNodeModules, { recursive: true });

for (const { src, dest } of sources) {
  if (!existsSync(src)) continue;
  cpSync(src, dest, { recursive: true });
}
