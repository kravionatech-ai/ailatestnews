import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      ".codex-preview/**",
      "node_modules/**",
      "next-env.d.ts",
      ".agents/**",
    ],
  },
];
