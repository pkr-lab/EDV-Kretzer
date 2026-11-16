const browserGlobals = {
  window: "readonly",
  document: "readonly",
  location: "readonly",
  localStorage: "readonly",
  fetch: "readonly",
  URLSearchParams: "readonly",
  setTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  atob: "readonly",
  console: "readonly",
  Promise: "readonly",
};

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  fetch: "readonly",
  URL: "readonly",
};

const rules = {
  "no-undef": "error",
  "no-unused-vars": ["error", { caughtErrors: "none" }],
  "no-shadow": "error",
};

export default [
  { ignores: ["dist/"] },
  {
    files: ["js/**/*.js"],
    languageOptions: { ecmaVersion: 5, sourceType: "script", globals: browserGlobals },
    rules,
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: nodeGlobals },
    rules,
  },
];
