import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import checkFile from "eslint-plugin-check-file";
import jsdoc from "eslint-plugin-jsdoc";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettierConfig,
  {
    plugins: {
      "check-file": checkFile,
      jsdoc: jsdoc,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
    rules: {
      // 1. Absolute Imports (@/)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./../*", "../../*"],
              message:
                "Please use absolute imports (e.g. @/...) instead of relative parent imports.",
            },
          ],
        },
      ],

      // 2. Naming Conventions (Files)
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/utils/**/*.{ts,tsx}": "KEBAB_CASE",
          "**/lib/**/*.{ts,tsx}": "KEBAB_CASE",
          "**/hooks/**/*.{ts,tsx}": "KEBAB_CASE",
          "**/components/**/*.{tsx}": "PASCAL_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/!(__tests__)": "KEBAB_CASE",
        },
      ],

      // 3. JSDoc Requirements
      "jsdoc/require-jsdoc": "warn",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off", // Handled by @typescript-eslint/no-unused-vars
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**",
      "prisma/seed.ts",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "scripts/**",
    ],
  },
];

export default eslintConfig;
