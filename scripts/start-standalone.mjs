// Runs the app the exact way Dockerfile does — `next start` warns that it
// doesn't work correctly with `output: "standalone"` (confirmed by actually
// running it), so local "does this behave like production" testing needs
// the real standalone entrypoint instead. `next build`'s standalone output
// doesn't include public/ or .next/static on its own — Dockerfile copies
// both in as separate COPY steps; this mirrors that before spawning the
// same server.js Docker runs.
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const STANDALONE_DIR = ".next/standalone";

if (!existsSync(STANDALONE_DIR)) {
  console.error(`${STANDALONE_DIR} not found — run "npm run build" first.`);
  process.exit(1);
}

cpSync("public", `${STANDALONE_DIR}/public`, { recursive: true });
cpSync(".next/static", `${STANDALONE_DIR}/.next/static`, { recursive: true });

const child = spawn(process.execPath, ["server.js"], {
  cwd: STANDALONE_DIR,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
