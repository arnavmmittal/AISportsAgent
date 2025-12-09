import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore build outputs and dependencies
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "dist/**/*",
      "build/**/*",
      ".cache/**/*",
      "coverage/**/*",
      "**/*.config.js",
      "**/*.config.mjs",
    ],
  },
  // Extend Next.js ESLint config
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    }
  }
];

export default eslintConfig;
