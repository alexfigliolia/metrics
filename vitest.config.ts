import { join } from "node:path";

import { defineConfig } from "vitest/config";

import tsconfig from "./tsconfig.json";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    alias: Object.keys(tsconfig.compilerOptions.paths).reduce(
      (acc, key) => {
        acc[key.replace("/*", "")] = join(
          __dirname,
          tsconfig.compilerOptions.paths[
            key as keyof typeof tsconfig.compilerOptions.paths
          ][0].replace("/*", ""),
        );
        return acc;
      },
      {} as Record<string, string>,
    ),
  },
});
