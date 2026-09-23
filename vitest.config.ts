import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
    // Resolves "server-only" (imported transitively by lib/prisma.ts and
    // anything that imports it) to its no-op export instead of the one that
    // throws — same reasoning as the NODE_OPTIONS=--conditions=react-server
    // pattern used for one-off scripts (see docs/DEVELOPER_GUIDE.md), just
    // configured once here instead of per-invocation. Needed under both
    // keys: Vitest resolves node_modules for its SSR/Node test environment
    // via `ssr.resolve`, not the plain `resolve` used for project source.
    conditions: ["react-server"],
  },
  ssr: {
    resolve: {
      conditions: ["react-server"],
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // lib/prisma.ts constructs its client eagerly at module load, so even a
    // test that never touches the database throws immediately on import if
    // DATABASE_URL is unset — same reason prisma/seed.ts loads dotenv itself.
    // CI already sets a dummy DATABASE_URL for exactly this reason (see
    // .github/workflows/ci.yml); this makes `npm test` work the same way
    // locally without requiring a real database connection.
    setupFiles: ["dotenv/config"],
  },
});
