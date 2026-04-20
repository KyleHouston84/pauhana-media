import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, updateEvent, getWLEDDevices } from "../api";
import type { RuntimeEventConfig, WLEDDevice } from "../api";
import "../App.css";

const EVENT_META: Record<string, { emoji: string; label: string; hasVideoSeek: boolean }> = {
  STORM: { emoji: "🌩️", label: "Storm", hasVideoSeek: false },
  ERUPTION: { emoji: "🌋", label: "Eruption", hasVideoSeek: true },
};

const inputStyle: React.CSSProperties = {
  width: "5rem",
  background: "#242424",
  border: "1px solid #444",
  borderRadius: "6px",
  color: "#fff",
  padding: "0.4rem 0.6rem",
  fontSize: "1rem",
  textAlign: "center",
};

interface EventCardProps {
  type: string;
  config: RuntimeEventConfig;
  allDevices: WLEDDevice[];
  onSave: (type: string, patch: Partial<RuntimeEventConfig>) => Promise<void>;
}

function EventCard({ type, config, allDevices, onSave }: EventCardProps) {
  const meta = EVENT_META[type] ?? { emoji: "⚡", label: type, hasVideoSeek: false };

  const [enabled, setEnabled] = useState(config.enabled);
  const [volume, setVolume] = useState(String(config.volume));
  const [durationSec, setDurationSec] = useState(String(config.durationSec));
  const [videoSeekTime, setVideoSeekTime] = useState(config.videoSeekTime ?? "");
  const [assignedDevices, setAssignedDevices] = useState<string[]>(config.wled.deviceNames);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEnabled(config.enabled);
    setVolume(String(config.volume));
    setDurationSec(String(config.durationSec));
    setVideoSeekTime(config.videoSeekTime ?? "");
    setAssignedDevices(config.wled.deviceNames);
  }, [config]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddDevice = (name: string) => {
    if (name && !assignedDevices.includes(name)) {
      setAssignedDevices((prev) => [...prev, name]);
    }
  };

  const handleRemoveDevice = (name: string) => {
    setAssignedDevices((prev) => prev.filter((d) => d !== name));
  };

  const handleSave = async () => {
    const vol = Number(volume);
    const dur = Number(durationSec);
    if (isNaN(vol) || vol < 0 || vol > 100) { showMessage("Volume must be 0–100"); return; }
    if (isNaN(dur) || dur < 1) { showMessage("Duration must be at least 1 second"); return; }

    setSaving(true);
    try {
      await onSave(type, {
        enabled,
        volume: vol,
        durationSec: dur,
        ...(meta.hasVideoSeek ? { videoSeekTime: videoSeekTime.trim() || null } : {}),
        wled: { deviceNames: assignedDevices, effect: config.wled.effect },
      });
      showMessage("Saved");
    } catch {
      showMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const unassignedDevices = allDevices.filter((d) => !assignedDevices.includes(d.name));

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "2px solid #667eea", paddingBottom: "0.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", border: "none", paddingBottom: 0 }}>
          {meta.emoji} {meta.label}
        </h2>
        <label className="toggle-switch" title={enabled ? "Disable event" : "Enable event"}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={saving}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Volume</h3>
            <p className="setting-description">Target audio level (0–100)</p>
          </div>
          <input
            type="number"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            disabled={saving}
            style={inputStyle}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h3>Duration</h3>
            <p className="setting-description">How long the event runs (seconds)</p>
          </div>
          <input
            type="number"
            min={1}
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            disabled={saving}
            style={inputStyle}
          />
        </div>

        {meta.hasVideoSeek && (
          <div className="setting-item">
            <div className="setting-info">
              <h3>Video Seek Time</h3>
              <p className="setting-description">Timestamp to jump to (MM:SS or HH:MM:SS)</p>
            </div>
            <input
              type="text"
              placeholder="30:41"
              value={videoSeekTime}
              onChange={(e) => setVideoSeekTime(e.target.value)}
              disabled={saving}
              style={{ ...inputStyle, width: "6rem", fontFamily: "monospace" }}
            />
          </div>
        )}
      </div>

      {/* WLED Devices Section */}
      <div style={{ marginTop: "1.25rem", borderTop: "1px solid #333", paddingTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#ddd" }}>💡 WLED Devices</h3>
          <span style={{
            fontSize: "0.75rem",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            background: "#242424",
            border: "1px solid #444",
            color: "#aaa",
            fontFamily: "monospace",
          }}>
            {config.wled.effect}
          </span>
        </div>

        {assignedDevices.length === 0 ? (
          <p className="placeholder-text" style={{ margin: "0.5rem 0" }}>No devices assigned</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
            {assignedDevices.map((name) => (
              <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#242424", borderRadius: "6px", padding: "0.4rem 0.6rem", border: "1px solid #333" }}>
                <span style={{ fontSize: "0.9rem" }}>💡 {name}</span>
                <button
                  onClick={() => handleRemoveDevice(name)}
                  disabled={saving}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "1rem", padding: "0 0.2rem", lineHeight: 1 }}
                  title="Remove device"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {unassignedDevices.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => { handleAddDevice(e.target.value); e.target.value = ""; }}
            disabled={saving}
            style={{
              width: "100%",
              background: "#242424",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#aaa",
              padding: "0.4rem 0.6rem",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            <option value="" disabled>+ Add device…</option>
            {unassignedDevices.map((d) => (
              <option key={d.ip} value={d.name}>{d.name} ({d.ip})</option>
            ))}
          </select>
        )}
      </div>

      <button
        className="trigger-button"
        onClick={handleSave}
        disabled={saving}
        style={{ width: "100%", marginTop: "1rem" }}
      >
        {saving ? "Saving…" : "💾 Save"}
      </button>

      {message && (
        <div className="warning-message" style={{ marginTop: "1rem" }}>{message}</div>
      )}
    </div>
  );
}

export function EventsConfig() {
  const [events, setEvents] = useState<Record<string, RuntimeEventConfig>>({});
  const [allDevices, setAllDevices] = useState<WLEDDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEvents(),
      getWLEDDevices().catch(() => ({ devices: [] as WLEDDevice[] })),
    ]).then(([eventsData, wledData]) => {
      setEvents(eventsData.events);
      setAllDevices(wledData.devices);
    }).catch((err) => {
      console.error("Failed to load events:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSave = async (type: string, patch: Partial<RuntimeEventConfig>) => {
    const { config } = await updateEvent(type, patch);
    setEvents((prev) => ({ ...prev, [type]: config }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link to="/admin" style={{ color: "#667eea", textDecoration: "none", fontSize: "0.95rem" }}>
          ← Back to Admin
        </Link>
      </div>

      {loading ? (
        <p className="placeholder-text">Loading events…</p>
      ) : (
        <div className="card-container">
          {Object.entries(events).map(([type, cfg]) => (
            <EventCard key={type} type={type} config={cfg} allDevices={allDevices} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
