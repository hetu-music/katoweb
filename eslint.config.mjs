import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // 全局忽略配置
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

  // 基础推荐配置
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js 配置
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // JavaScript/TypeScript 文件配置
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
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // JavaScript/TypeScript 规则
      "no-unused-vars": "off", // 关闭 JS 规则，使用 TS 规则
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      
      "no-undef": "off", // TypeScript 已处理
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-expressions": "warn",
      "no-useless-constructor": "off",
      "no-loop-func": "off",
      "prefer-const": "warn",
      "no-var": "error",

      // React 规则
      "react/react-in-jsx-scope": "off", // Next.js 不需要
      "react/prop-types": "off", // 使用 TypeScript
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // 可访问性规则
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

  // TypeScript 特定配置
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  // 配置文件特殊规则
  {
    files: ["*.config.{js,mjs,ts}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },

  // Prettier 配置（应该放在最后）
  ...compat.extends("prettier"),
];