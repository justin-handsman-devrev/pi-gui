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
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  scala: "scala",
  cli: "clojure",
  clj: "clojure",
  proto: "protobuf",
  tf: "hcl",
  hcl: "hcl",
};

const BASENAME_MAP: Record<string, string> = {
  Dockerfile: "dockerfile",
  Makefile: "makefile",
  Jenkinsfile: "groovy",
  Vagrantfile: "ruby",
  Gemfile: "ruby",
  Rakefile: "ruby",
  CargoToml: "toml",
  ".gitignore": "bash",
  ".env": "bash",
  ".env.local": "bash",
};

export function getLanguageFromPath(filePath: string): string | undefined {
  const parts = filePath.replace(/\\/g, "/").split("/");
  const basename = parts[parts.length - 1];

  // Exact basename match
  if (BASENAME_MAP[basename]) {
    return BASENAME_MAP[basename];
  }

  // Extension match (use last extension for .d.ts etc.)
  const dotIdx = basename.lastIndexOf(".");
  if (dotIdx > 0) {
    const ext = basename.slice(dotIdx + 1).toLowerCase();
    return EXTENSION_MAP[ext];
  }

  return undefined;
}
