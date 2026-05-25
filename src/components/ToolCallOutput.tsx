import { useState } from "react";
import type { ReactNode } from "react";
import { Braces, File, Terminal } from "lucide-react";
import type { ParsedToolOutput } from "@/lib/tool-output";

const PREVIEW_LINES = 12;
const PREVIEW_FILES = 24;

interface ToolCallOutputProps {
  parsed: ParsedToolOutput;
  toolName: string;
  rawValue: unknown;
}

function formatRawValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function FileListOutput({ files }: { files: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const overflow = files.length > PREVIEW_FILES;
  const visible = expanded || !overflow ? files : files.slice(0, PREVIEW_FILES);

  return (
    <div className="chat-tool-result">
      <div className="chat-tool-result-meta">
        {files.length} {files.length === 1 ? "entry" : "entries"}
      </div>
      <div className="chat-tool-file-grid">
        {visible.map((file) => {
          const isDir = file.endsWith("/");
          return (
            <span key={file} className={`chat-tool-file-chip${isDir ? " is-dir" : ""}`}>
              <File size={11} strokeWidth={2} aria-hidden="true" />
              <span className="chat-tool-file-chip-name">{file.replace(/\/$/, "")}</span>
              {isDir && <span className="chat-tool-file-chip-suffix">/</span>}
            </span>
          );
        })}
      </div>
      {overflow && (
        <button
          type="button"
          className="chat-tool-text-btn"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show ${files.length - PREVIEW_FILES} more`}
        </button>
      )}
    </div>
  );
}

function GrepOutput({ lines }: { lines: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const overflow = lines.length > PREVIEW_LINES;
  const visible = expanded || !overflow ? lines : lines.slice(0, PREVIEW_LINES);

  return (
    <div className="chat-tool-result">
      <div className="chat-tool-result-meta">
        {lines.length} {lines.length === 1 ? "match" : "matches"}
      </div>
      <div className="chat-tool-match-list">
        {visible.map((line, index) => (
          <div key={`${index}-${line.slice(0, 24)}`} className="chat-tool-match-line">
            {line}
          </div>
        ))}
      </div>
      {overflow && (
        <button
          type="button"
          className="chat-tool-text-btn"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show fewer" : `Show ${lines.length - PREVIEW_LINES} more`}
        </button>
      )}
    </div>
  );
}

function TextOutput({ text, label }: { text: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const overflow = lines.length > PREVIEW_LINES || text.length > 1200;
  const display = expanded || !overflow
    ? text
    : `${lines.slice(0, PREVIEW_LINES).join("\n")}${lines.length > PREVIEW_LINES ? "\n…" : ""}`;

  return (
    <div className="chat-tool-result">
      <div className="chat-tool-result-meta">{label}</div>
      <pre className="chat-tool-result-pre">{display}</pre>
      {overflow && (
        <button
          type="button"
          className="chat-tool-text-btn"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function ToolCallOutput({ parsed, toolName, rawValue }: ToolCallOutputProps) {
  const [showRaw, setShowRaw] = useState(parsed.kind === "json");
  const rawText = formatRawValue(rawValue);

  if (parsed.kind === "empty" && !rawText) return null;

  if (showRaw) {
    return (
      <div className="chat-tool-result">
        <div className="chat-tool-result-meta">
          <Braces size={11} aria-hidden="true" />
          Raw response
        </div>
        <pre className="chat-tool-result-pre chat-tool-result-pre--raw">{rawText}</pre>
        {parsed.kind !== "json" && (
          <button
            type="button"
            className="chat-tool-text-btn"
            onClick={() => setShowRaw(false)}
          >
            Show formatted
          </button>
        )}
      </div>
    );
  }

  let body: ReactNode = null;

  if (parsed.kind === "file-list" && parsed.files) {
    body = <FileListOutput files={parsed.files} />;
  } else if (parsed.kind === "grep-matches" && parsed.lines) {
    body = <GrepOutput lines={parsed.lines} />;
  } else if (parsed.kind === "bash") {
    body = (
      <div className="chat-tool-result">
        <div className="chat-tool-result-meta">
          <Terminal size={11} aria-hidden="true" />
          Output
        </div>
        <pre className="chat-tool-result-pre">{parsed.text}</pre>
      </div>
    );
  } else if (parsed.kind === "text") {
    const lineCount = parsed.text.split("\n").length;
    const label = toolName === "read"
      ? `${lineCount.toLocaleString()} ${lineCount === 1 ? "line" : "lines"}`
      : "Result";
    body = <TextOutput text={parsed.text} label={label} />;
  }

  if (!body) return null;

  return (
    <div className="chat-tool-output-wrap">
      {body}
      {rawText && parsed.kind !== "json" && (
        <button
          type="button"
          className="chat-tool-text-btn chat-tool-raw-toggle"
          onClick={() => setShowRaw(true)}
        >
          View raw JSON
        </button>
      )}
    </div>
  );
}
