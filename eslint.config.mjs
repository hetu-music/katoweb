import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig } from "eslint/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores:
      [
        ".next/**",
        ".env",
        "node_modules",
        "public/**",
        "next.config.js",
        "postcss.config.js",
        "next-env.d.ts"
      ]
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  { files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
  {
    rules: {
      "no-unused-vars": ["warn"],
      "no-undef": ["warn"],
      "class-methods-use-this": "warn",
      "no-unused-expressions": ["warn"],
      "no-useless-constructor": 0,
      "no-loop-func": 0,
      "jsx-a11y/alt-text": [
        "error",
        {
          "elements": ["img", "object", "area", "input[type='image']"],
          "exclude": ["Image", "ImageOff"]
        }
      ]
    }
  },

  js.configs.recommended,
  tseslint.configs.recommended,
  // 添加 Prettier 配置，必须放在最后以覆盖冲突规则
  ...compat.extends("prettier"),
]);
