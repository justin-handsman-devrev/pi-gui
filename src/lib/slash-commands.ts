import { getCommands, type PiSlashCommand } from "@/lib/tauri-commands";

export type { PiSlashCommand };

export type SlashCommandSource = PiSlashCommand["source"] | "app";

export interface LocalSlashCommand {
  kind: "local";
  id: string;
  label: string;
  description: string;
  source: "app";
  action: () => void;
}

export interface PiSlashMenuCommand {
  kind: "pi";
  id: string;
  label: string;
  description: string;
  source: PiSlashCommand["source"];
  name: string;
  scope?: string;
}

export type SlashMenuCommand = LocalSlashCommand | PiSlashMenuCommand;

const CACHE_MS = 30_000;
let cachedCommands: PiSlashCommand[] | null = null;
let cacheTime = 0;

export function invalidateSlashCommandCache(): void {
  cachedCommands = null;
  cacheTime = 0;
}

export async function fetchPiSlashCommands(force = false): Promise<PiSlashCommand[]> {
  if (!force && cachedCommands && Date.now() - cacheTime < CACHE_MS) {
    return cachedCommands;
  }

  try {
    const result = await getCommands();
    cachedCommands = result.commands;
    cacheTime = Date.now();
    return cachedCommands;
  } catch (error: unknown) {
    console.warn("[slash-commands] get_commands failed:", error);
    return cachedCommands ?? [];
  }
}

export function piCommandToMenuItem(command: PiSlashCommand): PiSlashMenuCommand {
  const scope = command.sourceInfo?.scope ?? command.location;
  return {
    kind: "pi",
    id: `pi:${command.source}:${command.name}`,
    label: `/${command.name}`,
    description: command.description?.trim() || sourceLabel(command.source, scope),
    source: command.source,
    name: command.name,
    scope,
  };
}

export function matchesSlashQuery(label: string, query: string): boolean {
  if (!query) return true;
  const normalizedLabel = label.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (normalizedLabel.startsWith(normalizedQuery)) return true;

  const queryBody = normalizedQuery.slice(1);
  if (!queryBody) return true;

  return (
    normalizedLabel.slice(1).includes(queryBody)
    || normalizedLabel.slice(1).startsWith(queryBody)
  );
}

export function groupSlashCommands(commands: SlashMenuCommand[]): Array<{
  id: string;
  label: string;
  items: SlashMenuCommand[];
}> {
  const order: SlashCommandSource[] = ["skill", "prompt", "extension", "app"];
  const labels: Record<SlashCommandSource, string> = {
    skill: "Skills",
    prompt: "Prompts",
    extension: "Extensions",
    app: "App",
  };

  const buckets = new Map<SlashCommandSource, SlashMenuCommand[]>();
  for (const command of commands) {
    const bucket = buckets.get(command.source) ?? [];
    bucket.push(command);
    buckets.set(command.source, bucket);
  }

  return order
    .filter((source) => (buckets.get(source)?.length ?? 0) > 0)
    .map((source) => ({
      id: source,
      label: labels[source],
      items: buckets.get(source) ?? [],
    }));
}

function sourceLabel(source: PiSlashCommand["source"], scope?: string): string {
  const scopeText = scope ? ` · ${scope}` : "";
  switch (source) {
    case "skill":
      return `Pi skill${scopeText}`;
    case "prompt":
      return `Prompt template${scopeText}`;
    case "extension":
      return `Extension command${scopeText}`;
    default:
      return "Pi command";
  }
}
