import { useState, useEffect } from "react";
import { getHealth, triggerStorm, triggerEruption } from "../api";
import "../App.css";

interface HealthData {
  status: string;
  stormActive: boolean;
  sonos: {
    state: string;
    volume: number;
    track: {
      artist?: string;
      title?: string;
      album?: string;
      albumArtURI?: string;
    } | null;
  };
}

export function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const fetchHealth = async () => {
    try {
      const data = await getHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError("Failed to connect to Pau Hana system");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleTriggerStorm = async () => {
    setTriggering(true);
    try {
      const result = await triggerStorm();
      alert(result.message);
      fetchHealth(); // Refresh status
    } catch (err) {
      alert("Failed to trigger storm. Check API key in .env");
    } finally {
      setTriggering(false);
    }
  };

  const handleTriggerEruption = async () => {
    setTriggering(true);
    try {
      const result = await triggerEruption();
      alert(result.message);
      fetchHealth(); // Refresh status
    } catch (err) {
      alert("Failed to trigger eruption. Check API key in .env");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading Pau Hana System...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>⚠️ Connection Error</h2>
        <p>{error}</p>
        <button onClick={fetchHealth}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="card-container">
        {/* System Status */}
        <div className="card">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Status:</span>
              <span
                className={`value ${health?.status === "ok" ? "success" : "error"}`}
              >
                {health?.status === "ok" ? "✅ Online" : "❌ Offline"}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Event Active:</span>
              <span className={`value ${health?.stormActive ? "warning" : ""}`}>
                {health?.stormActive ? "⚡ Yes" : "✓ No"}
              </span>
            </div>
          </div>
        </div>

        {/* Sonos Status */}
        <div className="card">
          <h2>🎵 Sonos</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">State:</span>
              <span className="value">{health?.sonos.state || "unknown"}</span>
            </div>
            <div className="status-item">
              <span className="label">Volume:</span>
              <span className="value">{health?.sonos.volume}</span>
            </div>
          </div>
          {health?.sonos.track && !health?.stormActive && (
            <div className="now-playing">
              <h3>Now Playing:</h3>
              <div className="track-display">
                {health.sonos.track.albumArtURI && (
                  <img
                    src={health.sonos.track.albumArtURI}
                    alt="Album Art"
                    className="album-art"
                  />
                )}
                <div className="track-info">
                  <div>
                    <strong>{health.sonos.track.title || "Unknown"}</strong>
                  </div>
                  <div>{health.sonos.track.artist || "Unknown Artist"}</div>
                  <div className="album">{health.sonos.track.album || ""}</div>
                </div>
              </div>
            </div>
          )}
          {health?.stormActive && (
            <div className="warning-message">
              ⚠️ Event in progress - please wait
            </div>
          )}
        </div>

        {/* Event Controls */}
        <div className="card controls">
          <h2>⚡ Event Controls</h2>
          <div className="button-grid">
            <button
              className="trigger-button storm"
              onClick={handleTriggerStorm}
              disabled={triggering || health?.stormActive}
            >
              <span className="icon">🌩️</span>
              <span>Summon Storm</span>
            </button>
            <button
              className="trigger-button eruption"
              onClick={handleTriggerEruption}
              disabled={triggering || health?.stormActive}
            >
              <span className="icon">🌋</span>
              <span>Trigger Eruption</span>
            </button>
          </div>
          {health?.stormActive && (
            <div className="warning-message">
              ⚠️ Event in progress - please wait
            </div>
          )}
        </div>

        {/* Settings Placeholder */}
        <div className="card settings-placeholder">
          <h2>⚙️ Settings</h2>
          <p className="placeholder-text">
            Coming soon: Control volume, intervals, LED settings and more
          </p>
        </div>
      </div>
    </>
  );
}
