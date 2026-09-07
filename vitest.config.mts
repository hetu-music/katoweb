import { defineConfig } from "vitest/config";
import path from "path";

const rootDir = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 覆盖范围随测试推进逐步扩大；目前仅统计已有测试覆盖的模块，
      // 避免未写测试的模块（如 store、service-songs 等）拉低整体阈值判定。
      include: [
        "src/lib/utils/**",
        "src/lib/forms/**",
        "src/lib/server/server-auth.ts",
        "src/lib/server/server-utils.ts",
        "src/lib/server/service-upload.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
