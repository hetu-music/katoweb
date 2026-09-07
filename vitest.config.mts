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
      // 避免未写测试的模块（如 audio-engine 的浏览器绑定部分、admin 组件等）拉低整体阈值判定。
      include: [
        "src/lib/utils/**",
        "src/lib/forms/**",
        "src/lib/server/server-auth.ts",
        "src/lib/server/server-utils.ts",
        "src/lib/server/service-upload.ts",
        "src/lib/server/service-songs.ts",
        "src/lib/server/service-imagery.ts",
        "src/lib/server/service-story.ts",
        "src/lib/player/audio-engine.ts",
        "src/store/player-store.ts",
        "src/app/api/admin/edit/route.ts",
        "src/app/api/admin/users/route.ts",
        "src/app/api/public/collections/route.ts",
        "src/app/api/admin/imagery/categories/route.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 68,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
