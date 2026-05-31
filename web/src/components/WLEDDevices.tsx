import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWLEDDevices, discoverWLEDDevices, setWLEDPower } from "../api";
import type { WLEDDevice } from "../api";

const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000;

export function WLEDDevices() {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [powering, setPowering] = useState(false);
  const [allOn, setAllOn] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getWLEDDevices();
      setDevices(data.devices);
    } catch (err) {
      console.error("Failed to load WLED devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => {
      discoverWLEDDevices()
        .then((data) => setDevices(data.devices))
        .catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const data = await discoverWLEDDevices();
      setDevices(data.devices);
      showMessage(data.message || `Found ${data.count} device(s)`);
    } catch (err) {
      showMessage("Discovery failed");
      console.error("WLED discovery failed:", err);
    } finally {
      setDiscovering(false);
    }
  };

  const handlePowerAll = async (on: boolean) => {
    if (devices.length === 0) return;
    setPowering(true);
    setAllOn(on);
    try {
      const results = await Promise.allSettled(devices.map((d) => setWLEDPower(d.ip, on)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        showMessage(`${failed} device${failed > 1 ? "s" : ""} didn't respond`);
      }
    } finally {
      setPowering(false);
    }
  };

  return (
    <div className="card">
      <h2>💡 WLED Devices {!loading && !discovering && `(${devices.length})`}</h2>

      {loading ? (
        <p className="placeholder-text">Loading devices...</p>
      ) : devices.length === 0 ? (
        <p className="placeholder-text">No devices found</p>
      ) : (
        <div className="status-grid">
          {devices.map((device) => (
            <div key={device.ip} className="status-item">
              <span className="status-label">{device.name}</span>
              <span className="status-value device-ip">{device.ip}</span>
            </div>
          ))}
        </div>
      )}

      <div className="all-lights-row">
        <span className="all-lights-label">All Lights</span>
        <label className="toggle-switch" title={allOn ? "Turn all off" : "Turn all on"}>
          <input
            type="checkbox"
            checked={allOn}
            onChange={(e) => handlePowerAll(e.target.checked)}
            disabled={powering || devices.length === 0}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="card-actions">
        <button
          className="trigger-button"
          onClick={handleDiscover}
          disabled={discovering}
        >
          {discovering ? "Scanning network..." : "🔍 Re-discover"}
        </button>
        <Link to="/admin/wled" className="trigger-button">
          ⚙️ Configure
        </Link>
      </div>

      {message && <div className="warning-message">{message}</div>}
    </div>
  );
}
