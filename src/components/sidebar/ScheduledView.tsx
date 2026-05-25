import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  Loader2,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { getActiveProjectCwd } from "@/lib/project-cwd";
import { shortProjectPath } from "@/lib/project-utils";
import { pickProjectDirectory } from "@/lib/pick-project-dir";
import {
  CRON_PRESETS,
  createScheduledJobDraft,
  deleteScheduledJob,
  describeCronSchedule,
  listScheduledJobs,
  setScheduledJobEnabled,
  upsertScheduledJob,
  type ScheduledJob,
} from "@/lib/scheduled-jobs";

export default function ScheduledView() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cwd, setCwd] = useState(() => getActiveProjectCwd() || "~/repos");
  const [presetId, setPresetId] = useState<string>("daily-9");
  const [customSchedule, setCustomSchedule] = useState("0 9 * * *");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listScheduledJobs();
      setJobs(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const selectedPreset = CRON_PRESETS.find((entry) => entry.id === presetId) ?? CRON_PRESETS[1];
  const schedule = presetId === "custom" ? customSchedule : selectedPreset.schedule;

  const resetForm = useCallback(() => {
    setName("");
    setPrompt("");
    setCwd(getActiveProjectCwd() || "~/repos");
    setPresetId("daily-9");
    setCustomSchedule("0 9 * * *");
    setShowForm(false);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!prompt.trim() || !cwd.trim() || !schedule.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const job = createScheduledJobDraft({ name, prompt, cwd, schedule });
      await upsertScheduledJob(job);
      await loadJobs();
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }, [cwd, loadJobs, name, prompt, resetForm, schedule]);

  const handleToggle = useCallback(async (job: ScheduledJob) => {
    setError(null);
    try {
      await setScheduledJobEnabled(job.id, !job.enabled);
      await loadJobs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [loadJobs]);

  const handleDelete = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteScheduledJob(id);
      await loadJobs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [loadJobs]);

  const handleBrowse = useCallback(async () => {
    const selected = await pickProjectDirectory();
    if (selected) setCwd(selected);
  }, []);

  return (
    <div className="sidebar-scheduled">
      <div className="sidebar-scheduled-toolbar">
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="sidebar-btn-primary"
        >
          <Plus size={13} />
          {showForm ? "Cancel" : "New schedule"}
        </button>
        <p className="sidebar-scheduled-system-note">
          Jobs are installed in your user crontab and run <code>pi -p</code> on schedule.
        </p>
      </div>

      {error && (
        <div className="sidebar-scheduled-error" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <div className="sidebar-scheduled-compose">
          <label className="sidebar-scheduled-field">
            <span className="sidebar-scheduled-label">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Daily standup summary"
              className="sidebar-scheduled-control"
            />
          </label>

          <label className="sidebar-scheduled-field">
            <span className="sidebar-scheduled-label">Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Summarize open PRs and TODOs in this repo"
              rows={3}
              className="sidebar-scheduled-input"
            />
          </label>

          <label className="sidebar-scheduled-field">
            <span className="sidebar-scheduled-label">Project directory</span>
            <div className="sidebar-scheduled-inline">
              <input
                type="text"
                value={cwd}
                onChange={(event) => setCwd(event.target.value)}
                className="sidebar-scheduled-control"
              />
              <button
                type="button"
                onClick={() => void handleBrowse()}
                className="sidebar-btn-outline"
                style={{ minHeight: 32, fontSize: 11 }}
              >
                Browse
              </button>
            </div>
          </label>

          <label className="sidebar-scheduled-field">
            <span className="sidebar-scheduled-label">Schedule</span>
            <select
              value={presetId}
              onChange={(event) => setPresetId(event.target.value)}
              className="sidebar-scheduled-control"
            >
              {CRON_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          {presetId === "custom" && (
            <label className="sidebar-scheduled-field">
              <span className="sidebar-scheduled-label">Cron expression</span>
              <input
                type="text"
                value={customSchedule}
                onChange={(event) => setCustomSchedule(event.target.value)}
                placeholder="0 9 * * 1-5"
                className="sidebar-scheduled-control sidebar-scheduled-control-mono"
              />
              <span className="sidebar-scheduled-hint">
                Five fields: minute hour day month weekday
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !prompt.trim() || !cwd.trim() || !schedule.trim()}
            className="sidebar-scheduled-send"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
            Add to crontab
          </button>
        </div>
      )}

      {loading ? (
        <div className="sidebar-empty">
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--muted-soft)" }} />
          <p className="sidebar-empty-desc">Loading cron jobs…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="sidebar-empty">
          <div className="sidebar-empty-icon">
            <Clock size={18} strokeWidth={1.5} />
          </div>
          <p className="sidebar-empty-title">No cron jobs</p>
          <p className="sidebar-empty-desc">
            Create a schedule to run pi prompts automatically via your system crontab.
          </p>
        </div>
      ) : (
        <div className="sidebar-scheduled-jobs">
          {jobs.map((job) => (
            <article
              key={job.id}
              className={`sidebar-scheduled-job${job.enabled ? "" : " is-disabled"}`}
            >
              <div className="sidebar-scheduled-job-header">
                <div className="min-w-0 flex-1">
                  <h3 className="sidebar-scheduled-job-name">{job.name}</h3>
                  <p className="sidebar-scheduled-job-schedule">
                    {describeCronSchedule(job.schedule)}
                  </p>
                </div>
                <div className="sidebar-scheduled-job-actions">
                  <button
                    type="button"
                    onClick={() => void handleToggle(job)}
                    className={`sidebar-scheduled-icon-btn${job.enabled ? " is-on" : ""}`}
                    title={job.enabled ? "Disable job" : "Enable job"}
                  >
                    <Power size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(job.id)}
                    className="sidebar-scheduled-icon-btn is-danger"
                    title="Remove from crontab"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="sidebar-scheduled-job-prompt">{job.prompt}</p>
              <p className="sidebar-scheduled-job-path" title={job.cwd}>
                {shortProjectPath(job.cwd)}
              </p>
              <p className="sidebar-scheduled-job-meta">
                {job.enabled ? "Active in crontab" : "Disabled"}
                {" · "}
                <code className="sidebar-scheduled-job-cron">{job.schedule}</code>
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
