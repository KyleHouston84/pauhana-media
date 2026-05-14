import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getWLEDDevices,
  discoverWLEDDevices,
  getWLEDDeviceInfo,
  renameWLEDDevice,
  setWLEDPower,
} from "../api";
import type { WLEDDeviceInfo } from "../api";
import { DeviceCard } from "../components/DeviceCard";
import { EffectLibrarySection } from "../components/EffectLibrarySection";
import "../App.css";

export function WLEDConfig() {
  const [devices, setDevices] = useState<WLEDDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [powering, setPowering] = useState(false);
  const [message, setMessage] = useState("");

  const allOn = devices.length > 0 && devices.some((d) => d.on === true);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadDevices = async () => {
    setLoading(true);
    try {
      const { devices: list } = await getWLEDDevices();
      const infos = await Promise.all(
        list.map((d) =>
          getWLEDDeviceInfo(d.ip).catch(
            () => ({ ip: d.ip, name: d.name }) as WLEDDeviceInfo,
          ),
        ),
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

  const handlePowerAll = async (on: boolean) => {
    if (devices.length === 0) return;
    setPowering(true);
    try {
      const results = await Promise.allSettled(
        devices.map((d) => setWLEDPower(d.ip, on).then(() => d.ip)),
      );
      const succeeded = new Set(
        results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value),
      );
      const failed = results.length - succeeded.size;
      setDevices((prev) => prev.map((d) => (succeeded.has(d.ip) ? { ...d, on } : d)));
      if (failed > 0) {
        showMessage(`${failed} device${failed > 1 ? "s" : ""} didn't respond`);
      }
    } finally {
      setPowering(false);
    }
  };

  return (
    <div>
      <div className="page-toolbar">
        <Link to="/admin" className="page-back-link">
          ← Back to Admin
        </Link>
        <div className="page-toolbar-right">
          <button
            className="logs-button"
            onClick={handleDiscover}
            disabled={discovering || loading}
          >
            {discovering ? "Scanning network…" : "🔍 Re-discover"}
          </button>
        </div>
      </div>
      <div className="page-toolbar flex-end">
        <label
          className="all-lights-toggle"
          title={allOn ? "Turn all off" : "Turn all on"}
        >
          All Lights
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => handlePowerAll(e.target.checked)}
              disabled={powering || loading || devices.length === 0}
            />
            <span className="toggle-slider"></span>
          </label>
        </label>
      </div>

      {message && <div className="warning-message">{message}</div>}

      {loading ? (
        <p className="placeholder-text">Loading devices…</p>
      ) : devices.length === 0 ? (
        <p className="placeholder-text">
          No WLED devices found. Try re-discovering.
        </p>
      ) : (
        <div className="card-container">
          {devices.map((device) => (
            <DeviceCard
              key={device.ip}
              device={device}
              onRename={handleRename}
              onPowerChange={handlePowerChange}
            />
          ))}
        </div>
      )}

      <EffectLibrarySection devices={devices} />
    </div>
  );
}
