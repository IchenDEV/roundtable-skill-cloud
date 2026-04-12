import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".generated/**"]),
  eslintConfigPrettier,
]);

export default eslintConfig;
