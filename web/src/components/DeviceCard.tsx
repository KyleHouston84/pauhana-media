import { useState } from "react";
import { rssiLabel, brightnessPercent } from "../utils/wledHelpers";
import type { WLEDDeviceInfo } from "../api";

interface DeviceCardProps {
  device: WLEDDeviceInfo;
  onRename: (ip: string, name: string) => Promise<void>;
  onPowerChange: (ip: string, on: boolean) => Promise<void>;
}

export function DeviceCard({ device, onRename, onPowerChange }: DeviceCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(device.name);
  const [saving, setSaving] = useState(false);
  const [powerToggling, setPowerToggling] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSave = async () => {
    if (!nameInput.trim() || nameInput === device.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(device.ip, nameInput.trim());
      showMessage("Renamed successfully");
      setEditing(false);
    } catch {
      showMessage("Failed to rename");
      setNameInput(device.name);
    } finally {
      setSaving(false);
    }
  };

  const handlePowerToggle = async () => {
    if (device.on === undefined) return;
    setPowerToggling(true);
    try {
      await onPowerChange(device.ip, !device.on);
    } catch {
      showMessage("Failed to toggle power");
    } finally {
      setPowerToggling(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setNameInput(device.name);
      setEditing(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", borderBottom: "2px solid #667eea", paddingBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.2rem" }}>💡</span>
        {editing ? (
          <>
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              style={{
                flex: 1,
                background: "#242424",
                border: "1px solid #667eea",
                borderRadius: "6px",
                color: "#fff",
                padding: "0.25rem 0.5rem",
                fontSize: "1.1rem",
              }}
            />
            <button onClick={handleSave} disabled={saving} className="logs-button">
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setNameInput(device.name); setEditing(false); }}
              disabled={saving}
              className="logs-button"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h2 style={{ margin: 0, fontSize: "1.3rem", flex: 1, border: "none", paddingBottom: 0 }}>{device.name}</h2>
            <button onClick={() => setEditing(true)} className="logs-button" title="Rename device">
              ✏️ Rename
            </button>
            <a
              href={`http://${device.ip}`}
              target="_blank"
              rel="noreferrer"
              className="logs-button"
              style={{ textDecoration: "none" }}
              title="Open WLED web UI"
            >
              🌐
            </a>
          </>
        )}
      </div>

      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">IP Address</span>
          <span className="status-value" style={{ fontFamily: "monospace" }}>{device.ip}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Power</span>
          {device.on === undefined ? (
            <span className="status-value" style={{ color: "#888" }}>—</span>
          ) : (
            <label className="toggle-switch" title={device.on ? "Turn off" : "Turn on"} style={{ opacity: powerToggling ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={device.on}
                onChange={handlePowerToggle}
                disabled={powerToggling}
              />
              <span className="toggle-slider"></span>
            </label>
          )}
        </div>
        <div className="status-item">
          <span className="status-label">Brightness</span>
          <span className="status-value">{brightnessPercent(device.brightness)}</span>
        </div>
        <div className="status-item">
          <span className="status-label">LEDs</span>
          <span className="status-value">{device.ledCount ?? "—"}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Firmware</span>
          <span className="status-value">{device.version ?? "—"}</span>
        </div>
        <div className="status-item">
          <span className="status-label">WiFi Signal</span>
          <span className="status-value">{rssiLabel(device.rssi)}</span>
        </div>
      </div>

      {message && (
        <div className="warning-message" style={{ marginTop: "1rem" }}>{message}</div>
      )}
    </div>
  );
}
