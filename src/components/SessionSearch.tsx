import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useSessionHistoryStore } from "@/stores/sessionHistoryStore";

export default function SessionSearch() {
  const searchQuery = useSessionHistoryStore((s) => s.searchQuery);
  const setSearchQuery = useSessionHistoryStore((s) => s.setSearchQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
      setFocused(true);
    };
    window.addEventListener("pi:search-focus", handler);
    return () => window.removeEventListener("pi:search-focus", handler);
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, [setSearchQuery]);

  return (
    <div className="sidebar-section">
      <p className="sidebar-section-label">Search</p>
      <div className="sidebar-search">
        <Search
          size={13}
          strokeWidth={1.75}
          style={{
            color: focused ? "var(--muted)" : "var(--muted-soft)",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
        />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search sessions…"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="sidebar-icon-btn"
            style={{ width: 24, height: 24 }}
            aria-label="Clear search"
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
