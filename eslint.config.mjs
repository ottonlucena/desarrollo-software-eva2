import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /*
       * Un guion bajo delante del nombre marca un parámetro que existe solo por la posición
       * que ocupa en la firma y que no se usa. Ocurre con las Server Actions, cuyo primer
       * argumento es el estado anterior del formulario aunque no siempre haga falta.
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cliente que Prisma genera a partir del esquema: no es código nuestro.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
