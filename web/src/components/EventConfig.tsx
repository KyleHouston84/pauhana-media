import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, triggerStorm, triggerEruption } from "../api";
import type { RuntimeEventConfig } from "../api";

const EVENT_META: Record<string, { emoji: string; label: string }> = {
  STORM: { emoji: "🌩️", label: "Storm" },
  ERUPTION: { emoji: "🌋", label: "Eruption" },
};

const TRIGGER_FNS: Record<string, () => Promise<{ ok: boolean; message: string }>> = {
  STORM: triggerStorm,
  ERUPTION: triggerEruption,
};

export function EventConfig() {
  const [events, setEvents] = useState<Record<string, RuntimeEventConfig>>({});
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(data.events))
      .catch((err) => console.error("Failed to load events:", err))
      .finally(() => setLoading(false));
  }, []);

  const showMessage = (type: string, msg: string) => {
    setMessages((prev) => ({ ...prev, [type]: msg }));
    setTimeout(() => setMessages((prev) => ({ ...prev, [type]: "" })), 3000);
  };

  const handleTrigger = async (type: string) => {
    const fn = TRIGGER_FNS[type];
    if (!fn) return;
    setTriggering((prev) => ({ ...prev, [type]: true }));
    try {
      await fn();
      showMessage(type, "Triggered!");
    } catch {
      showMessage(type, "Already active or failed");
    } finally {
      setTriggering((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="card">
      <h2>🌩️ Event Configuration</h2>

      {loading ? (
        <p className="placeholder-text">Loading…</p>
      ) : (
        <div className="event-list">
          {Object.entries(events).map(([type, cfg]) => {
            const meta = EVENT_META[type] ?? { emoji: "⚡", label: type };
            return (
              <div key={type} className="event-row">
                <span className="event-name">
                  {meta.emoji} {meta.label}
                </span>
                <span className={`event-status ${cfg.enabled ? "event-status--enabled" : ""}`}>
                  {cfg.enabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() => handleTrigger(type)}
                  disabled={triggering[type] || !cfg.enabled}
                  className="trigger-button btn-inline"
                >
                  {triggering[type] ? "…" : messages[type] ? messages[type] : "▶ Trigger"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-footer">
        <Link to="/admin/events" className="trigger-button btn-block">
          ⚙️ Configure Events
        </Link>
      </div>
    </div>
  );
}
