import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    settings: { next: { rootDir: "apps/postcode" }, react: { version: "19" } },
  },
  globalIgnores(["**/.next/**", "**/next-env.d.ts", "**/.venv/**"]),
]);
