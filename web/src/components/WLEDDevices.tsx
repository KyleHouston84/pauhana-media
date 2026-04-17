import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWLEDDevices, discoverWLEDDevices } from "../api";
import type { WLEDDevice } from "../api";

export function WLEDDevices() {
  const [devices, setDevices] = useState<WLEDDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
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
      console.error("Failed to fetch WLED devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
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

  return (
    <div className="card">
      <h2>💡 WLED Devices {!loading && `(${devices.length})`}</h2>

      {loading ? (
        <p className="placeholder-text">Loading devices...</p>
      ) : devices.length === 0 ? (
        <p className="placeholder-text">No devices found</p>
      ) : (
        <div className="status-grid">
          {devices.map((device) => (
            <div key={device.ip} className="status-item">
              <span className="status-label">{device.name}</span>
              <span className="status-value" style={{ fontFamily: "monospace", fontSize: "0.85em" }}>{device.ip}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
        <button
          className="trigger-button"
          onClick={handleDiscover}
          disabled={discovering}
          style={{ flex: 1 }}
        >
          {discovering ? "Scanning network..." : "🔍 Re-discover"}
        </button>
        <Link
          to="/wled"
          className="trigger-button"
          style={{ flex: 1, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ⚙️ Configure
        </Link>
      </div>

      {message && (
        <div className="warning-message" style={{ marginTop: "1rem" }}>
          {message}
        </div>
      )}
    </div>
  );
}
