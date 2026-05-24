/**
 * Detect a highlight.js language identifier from a file path.
 *
 * Covers common languages. Returns undefined for unknown extensions so
 * highlight.js can auto-detect instead.
 */

const EXTENSION_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  cs: "csharp",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  c: "c",
  h: "c",
  hpp: "cpp",
  hxx: "cpp",
  html: "xml",
  htm: "xml",
  svg: "xml",
  xml: "xml",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  ini: "ini",
  cfg: "ini",
  md: "markdown",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  dockerfile: "dockerfile",
  makefile: "makefile",
  graphql: "graphql",
  gql: "graphql",
  vue: "xml",
  svelte: "xml",
  swift: "swift",
  dart: "dart",
  lua: "lua",
  r: "r",
  pl: "perl",
  pm: "perl",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  scala: "scala",
  clj: "clojure",
  cljs: "clojure",
  proto: "protobuf",
  tf: "hcl",
  hcl: "hcl",
  txt: "plaintext",
  log: "plaintext",
  env: "bash",
  gitignore: "bash",
  lock: "json",
};

const BASENAME_MAP: Record<string, string> = {
  Dockerfile: "dockerfile",
  Makefile: "makefile",
  Jenkinsfile: "groovy",
  Vagrantfile: "ruby",
  Gemfile: "ruby",
  Rakefile: "ruby",
  ".gitignore": "bash",
  ".env": "bash",
  ".env.local": "bash",
  ".env.production": "bash",
  ".env.development": "bash",
  ".eslintrc": "json",
  ".eslintrc.js": "javascript",
  ".eslintrc.json": "json",
  ".prettierrc": "json",
  "tsconfig.json": "json",
  "package.json": "json",
  "Cargo.toml": "ini",
  "go.mod": "go",
  "go.sum": "plaintext",
  "requirements.txt": "plaintext",
  "Pipfile": "toml",
  ".babelrc": "json",
  ".babelrc.js": "javascript",
  "webpack.config.js": "javascript",
  "vite.config.ts": "typescript",
  "tailwind.config.js": "javascript",
  "tailwind.config.ts": "typescript",
  "next.config.js": "javascript",
  "next.config.mjs": "javascript",
  "next.config.ts": "typescript",
};

export function getLanguageFromPath(filePath: string): string | undefined {
  const parts = filePath.replace(/\\/g, "/").split("/");
  const basename = parts[parts.length - 1];

  // Exact basename match (handles dotfiles like .gitignore, config files)
  if (BASENAME_MAP[basename]) {
    return BASENAME_MAP[basename];
  }

  // Extension match (use last extension for .d.ts, .module.css etc.)
  const dotIdx = basename.lastIndexOf(".");
  if (dotIdx > 0) {
    const ext = basename.slice(dotIdx + 1).toLowerCase();
    if (EXTENSION_MAP[ext]) {
      return EXTENSION_MAP[ext];
    }

    // Try second-to-last extension for compound extensions like .d.ts
    const secondDot = basename.lastIndexOf(".", dotIdx - 1);
    if (secondDot > 0) {
      const compoundExt = basename.slice(secondDot + 1).toLowerCase();
      if (EXTENSION_MAP[compoundExt]) {
        return EXTENSION_MAP[compoundExt];
      }
    }
  }

  return undefined;
}
