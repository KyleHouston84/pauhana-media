import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api";
import type { RuntimeEventConfig } from "../api";

const EVENT_META: Record<string, { emoji: string; label: string }> = {
  STORM: { emoji: "🌩️", label: "Storm" },
  ERUPTION: { emoji: "🌋", label: "Eruption" },
};

export function EventConfig() {
  const [events, setEvents] = useState<Record<string, RuntimeEventConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data.events))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2>🌩️ Event Configuration</h2>

      {loading ? (
        <p className="placeholder-text">Loading…</p>
      ) : (
        <div className="status-grid">
          {Object.entries(events).map(([type, cfg]) => {
            const meta = EVENT_META[type] ?? { emoji: "⚡", label: type };
            return (
              <div key={type} className="status-item">
                <span className="status-label">
                  {meta.emoji} {meta.label}
                </span>
                <span className="status-value" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                  <span style={{ color: cfg.enabled ? "#4ade80" : "#888", fontSize: "0.8rem" }}>
                    {cfg.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                    Vol {cfg.volume} · {cfg.durationSec}s
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <Link
          to="/admin/events"
          className="trigger-button"
          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
        >
          ⚙️ Configure Events
        </Link>
      </div>
    </div>
  );
}
