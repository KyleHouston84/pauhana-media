import { useState, useEffect } from "react";
import { playVideo, pauseVideo, seekVideo, getVideoPosition, getRandomEventsEnabled, setRandomEventsEnabled } from "../api";
import "../App.css";

export function Admin() {
  const [videoPosition, setVideoPosition] = useState<number | null>(null);
  const [seekTime, setSeekTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [randomEventsEnabled, setRandomEventsEnabledState] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchVideoPosition = async () => {
    try {
      const data = await getVideoPosition();
      if (data.position !== undefined) {
        setVideoPosition(data.position);
      }
    } catch (err) {
      console.error("Failed to get video position:", err);
    }
  };

  const fetchRandomEventsState = async () => {
    try {
      const data = await getRandomEventsEnabled();
      setRandomEventsEnabledState(data.enabled);
    } catch (err) {
      console.error("Failed to get random events state:", err);
    }
  };

  useEffect(() => {
    fetchVideoPosition();
    fetchRandomEventsState();
    const interval = setInterval(fetchVideoPosition, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePlay = async () => {
    setLoading(true);
    try {
      const result = await playVideo();
      showMessage(result.message || "Video resumed");
      fetchVideoPosition();
    } catch (err) {
      showMessage("Failed to play video");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const result = await pauseVideo();
      showMessage(result.message || "Video paused");
      fetchVideoPosition();
    } catch (err) {
      showMessage("Failed to pause video");
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seekTime) return;

    setLoading(true);
    try {
      const result = await seekVideo(seekTime);
      showMessage(result.message || `Seeked to ${seekTime}`);
      setSeekTime("");
      fetchVideoPosition();
    } catch (err) {
      showMessage("Failed to seek video");
    } finally {
      setLoading(false);
    }
  };

  const quickSeek = async (timestamp: string) => {
    setLoading(true);
    try {
      const result = await seekVideo(timestamp);
      showMessage(result.message || `Seeked to ${timestamp}`);
      fetchVideoPosition();
    } catch (err) {
      showMessage("Failed to seek video");
    } finally {
      setLoading(false);
    }
  };

  const handleRandomEventsToggle = async () => {
    setSettingsLoading(true);
    try {
      const newState = !randomEventsEnabled;
      const result = await setRandomEventsEnabled(newState);
      setRandomEventsEnabledState(result.enabled);
      showMessage(result.message || (newState ? "Random events enabled" : "Random events disabled"));
    } catch (err) {
      showMessage("Failed to update random events setting");
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <>
      <div className="dashboard">
        {/* Video Controls */}
        <div className="card">
          <h2>🎬 Video Controls</h2>

          {videoPosition !== null && (
            <div className="status-grid">
              <div className="status-item">
                <span className="label">Current Position:</span>
                <span className="value">{formatTime(videoPosition)}</span>
              </div>
            </div>
          )}

          <div className="button-grid">
            <button
              className="trigger-button"
              onClick={handlePlay}
              disabled={loading}
            >
              ▶️ Play
            </button>
            <button
              className="trigger-button"
              onClick={handlePause}
              disabled={loading}
            >
              ⏸️ Pause
            </button>
          </div>

          <form onSubmit={handleSeek} style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="MM:SS or HH:MM:SS"
                value={seekTime}
                onChange={(e) => setSeekTime(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  fontSize: "1rem",
                  border: "2px solid #8B4789",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              />
              <button
                type="submit"
                className="trigger-button"
                disabled={loading || !seekTime}
              >
                Seek
              </button>
            </div>
          </form>

          <div style={{ marginTop: "1rem" }}>
            <p style={{ marginBottom: "0.5rem", opacity: 0.8 }}>Quick Seek:</p>
            <div className="button-grid">
              <button
                className="trigger-button"
                onClick={() => quickSeek("0:00")}
                disabled={loading}
                style={{ fontSize: "0.9rem" }}
              >
                Start (0:00)
              </button>
              <button
                className="trigger-button eruption"
                onClick={() => quickSeek("30:41")}
                disabled={loading}
                style={{ fontSize: "0.9rem" }}
              >
                Eruption (30:41)
              </button>
            </div>
          </div>

          {message && (
            <div className="warning-message" style={{ marginTop: "1rem" }}>
              {message}
            </div>
          )}
        </div>

        {/* System Settings */}
        <div className="card">
          <h2>⚙️ System Settings</h2>

          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Random Events</h3>
                <p className="setting-description">
                  Automatically trigger random storm or eruption events when music is playing
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={randomEventsEnabled}
                  onChange={handleRandomEventsToggle}
                  disabled={settingsLoading}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <p className="placeholder-text" style={{ marginTop: "1rem" }}>
            Coming soon: Volume controls, event intervals, WLED configuration
          </p>
        </div>

        {/* Event Settings Placeholder */}
        <div className="card">
          <h2>🌩️ Event Configuration</h2>
          <p className="placeholder-text">
            Coming soon: Storm duration, eruption effects, sound levels
          </p>
        </div>
      </div>
    </>
  );
}
