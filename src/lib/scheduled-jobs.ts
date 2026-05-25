import type { ScheduledJobRecord } from "@/lib/tauri-commands";

export type ScheduledJob = ScheduledJobRecord;

export {
  listScheduledJobs,
  upsertScheduledJob,
  deleteScheduledJob,
  setScheduledJobEnabled,
} from "@/lib/tauri-commands";

export const CRON_PRESETS = [
  { id: "hourly", label: "Every hour", schedule: "0 * * * *" },
  { id: "daily-9", label: "Daily at 9:00 AM", schedule: "0 9 * * *" },
  { id: "weekdays-9", label: "Weekdays at 9:00 AM", schedule: "0 9 * * 1-5" },
  { id: "weekly-mon", label: "Mondays at 9:00 AM", schedule: "0 9 * * 1" },
  { id: "custom", label: "Custom cron", schedule: "" },
] as const;

export function describeCronSchedule(schedule: string): string {
  const preset = CRON_PRESETS.find((entry) => entry.schedule === schedule);
  if (preset && preset.id !== "custom") return preset.label;
  return schedule;
}

export function createScheduledJobDraft(input: {
  name: string;
  prompt: string;
  cwd: string;
  schedule: string;
}): ScheduledJob {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: input.name.trim() || "Scheduled task",
    prompt: input.prompt.trim(),
    cwd: input.cwd.trim(),
    schedule: input.schedule.trim(),
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}
