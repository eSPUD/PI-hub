import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "next-env.d.ts",
      "content/**",
      "public/sw.js",
      "public/sw.js.map",
      "public/workbox-*.js",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Common pattern for syncing form state to props; React 19's new
      // rule flags it as an error. Keep as a warning until we refactor
      // to derived-state-with-key.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
