import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getWLEDDevices,
  discoverWLEDDevices,
  getWLEDDeviceInfo,
  renameWLEDDevice,
} from "../api";
import type { WLEDDeviceInfo } from "../api";
import "../App.css";

function rssiLabel(rssi?: number): string {
  if (rssi === undefined) return "—";
  if (rssi >= -50) return `Excellent (${rssi} dBm)`;
  if (rssi >= -65) return `Good (${rssi} dBm)`;
  if (rssi >= -75) return `Fair (${rssi} dBm)`;
  return `Poor (${rssi} dBm)`;
}

function brightnessPercent(bri?: number): string {
  if (bri === undefined) return "—";
  return `${Math.round((bri / 255) * 100)}%`;
}

interface DeviceCardProps {
  device: WLEDDeviceInfo;
  onRename: (ip: string, name: string) => Promise<void>;
}

function DeviceCard({ device, onRename }: DeviceCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(device.name);
  const [saving, setSaving] = useState(false);
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="logs-button"
            >
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
            <button
              onClick={() => setEditing(true)}
              className="logs-button"
              title="Rename device"
            >
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
          <span className="status-label">Status</span>
          <span className="status-value" style={{ color: device.on ? "#4ade80" : "#888" }}>
            {device.on === undefined ? "—" : device.on ? "On" : "Off"}
          </span>
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

export function WLEDConfig() {
  const [devices, setDevices] = useState<WLEDDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const { devices: list } = await getWLEDDevices();
      const infos = await Promise.all(
        list.map((d) => getWLEDDeviceInfo(d.ip).catch(() => ({ ip: d.ip, name: d.name } as WLEDDeviceInfo)))
      );
      setDevices(infos);
    } catch (err) {
      console.error("Failed to load WLED devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const data = await discoverWLEDDevices();
      showMessage(data.message || `Found ${data.count} device(s)`);
      await loadDevices();
    } catch {
      showMessage("Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const handleRename = async (ip: string, name: string) => {
    await renameWLEDDevice(ip, name);
    setDevices((prev) =>
      prev.map((d) => (d.ip === ip ? { ...d, name } : d))
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <Link
          to="/admin"
          style={{ color: "#667eea", textDecoration: "none", fontSize: "0.95rem" }}
        >
          ← Back to Admin
        </Link>
        <button
          className="logs-button"
          onClick={handleDiscover}
          disabled={discovering || loading}
        >
          {discovering ? "Scanning network…" : "🔍 Re-discover"}
        </button>
      </div>

      {message && (
        <div className="warning-message" style={{ marginBottom: "1rem" }}>{message}</div>
      )}

      {loading ? (
        <p className="placeholder-text">Loading devices…</p>
      ) : devices.length === 0 ? (
        <p className="placeholder-text">No WLED devices found. Try re-discovering.</p>
      ) : (
        <div className="card-container">
          {devices.map((device) => (
            <DeviceCard key={device.ip} device={device} onRename={handleRename} />
          ))}
        </div>
      )}
    </div>
  );
}
