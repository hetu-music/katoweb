// eslint.config.mjs
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next"; // 包含 jsx-a11y
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default defineConfig(
  // ==================== 全局忽略 ====================
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      ".env*",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },

  // ==================== 基础推荐 ====================
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ==================== Next.js 完整配置（包含 jsx-a11y）===================
  nextConfig,  // 直接使用，不拆分

  // ==================== React Hooks（手动注册）===================
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // ==================== 自定义 a11y 规则（无需注册插件）===================
  // 因为 nextConfig 已注册 jsx-a11y，直接覆盖规则即可
  {
    rules: {
      "jsx-a11y/alt-text": [
        "error",
        {
          elements: ["img", "object", "area", "input[type='image']"],
          img: ["Image"],
        },
      ],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },

  // ==================== 通用 JS/TS 配置 ====================
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-expressions": "warn",
      "no-useless-constructor": "off",
      "no-loop-func": "off",
      "prefer-const": "warn",
      "no-var": "error",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },

  // ==================== 仅 TS 文件 ====================
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  // ==================== 配置文件特殊处理 ====================
  {
    files: ["*.config.{js,mjs,ts}"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-var-requires": "off" },
  },

  // ==================== Prettier 收尾 ====================
  prettierConfig,
);