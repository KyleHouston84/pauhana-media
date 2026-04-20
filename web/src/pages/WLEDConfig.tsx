import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWLEDDevices, discoverWLEDDevices, getWLEDDeviceInfo, renameWLEDDevice, setWLEDPower } from "../api";
import type { WLEDDeviceInfo } from "../api";
import { DeviceCard } from "../components/DeviceCard";
import { EffectLibrarySection } from "../components/EffectLibrarySection";
import "../App.css";

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
    setDevices((prev) => prev.map((d) => (d.ip === ip ? { ...d, name } : d)));
  };

  const handlePowerChange = async (ip: string, on: boolean) => {
    await setWLEDPower(ip, on);
    setDevices((prev) => prev.map((d) => (d.ip === ip ? { ...d, on } : d)));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <Link to="/admin" style={{ color: "#667eea", textDecoration: "none", fontSize: "0.95rem" }}>
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
            <DeviceCard key={device.ip} device={device} onRename={handleRename} onPowerChange={handlePowerChange} />
          ))}
        </div>
      )}

      <EffectLibrarySection devices={devices} />
    </div>
  );
}
