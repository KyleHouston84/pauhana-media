import { useState } from "react";
import { rssiLabel } from "../utils/wledHelpers";
import type { WLEDDeviceInfo } from "../api";

interface DeviceCardProps {
  device: WLEDDeviceInfo;
  onRename: (ip: string, name: string) => Promise<void>;
  onPowerChange: (ip: string, on: boolean) => Promise<void>;
  onBrightnessChange: (ip: string, brightness: number) => Promise<void>;
}

export function DeviceCard({ device, onRename, onPowerChange, onBrightnessChange }: DeviceCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(device.name);
  const [saving, setSaving] = useState(false);
  const [powerToggling, setPowerToggling] = useState(false);
  const [brightnessValue, setBrightnessValue] = useState(device.brightness ?? 128);
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

  const isOnline = device.ledCount !== undefined;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">💡</span>
        <span
          className={`status-dot ${isOnline ? "status-dot--online" : "status-dot--offline"}`}
          title={isOnline ? "Online" : "Offline"}
        />
        {editing ? (
          <>
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="card-name-input"
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
            <h2 className="card-header-title">{device.name}</h2>
            <button onClick={() => setEditing(true)} className="logs-button" title="Rename device">
              ✏️ Rename
            </button>
            <a
              href={`http://${device.ip}`}
              target="_blank"
              rel="noreferrer"
              className="logs-button btn-link"
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
          <span className="status-value status-mono">{device.ip}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Power</span>
          {device.on === undefined ? (
            <span className="status-value status-muted">—</span>
          ) : (
            <label
              className={`toggle-switch${powerToggling ? " is-toggling" : ""}`}
              title={device.on ? "Turn off" : "Turn on"}
            >
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
        <div className="status-item status-item--full">
          <span className="status-label">Brightness</span>
          {device.brightness === undefined ? (
            <span className="status-value status-muted">—</span>
          ) : (
            <div className="brightness-control">
              <input
                type="range"
                min={0}
                max={255}
                value={brightnessValue}
                onChange={(e) => setBrightnessValue(Number(e.target.value))}
                onMouseUp={(e) => onBrightnessChange(device.ip, Number((e.target as HTMLInputElement).value)).catch(() => showMessage("Failed to set brightness"))}
                onTouchEnd={(e) => onBrightnessChange(device.ip, Number((e.target as HTMLInputElement).value)).catch(() => showMessage("Failed to set brightness"))}
                className="brightness-slider"
                disabled={!device.on}
              />
              <span className="brightness-pct">{Math.round((brightnessValue / 255) * 100)}%</span>
            </div>
          )}
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

      {message && <div className="warning-message">{message}</div>}
    </div>
  );
}
