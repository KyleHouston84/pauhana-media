import { useState, useEffect } from "react";
import { playVideo, pauseVideo, seekVideo, getVideoPosition } from "../api";

export function VideoControls() {
  const [videoPosition, setVideoPosition] = useState<number | null>(null);
  const [seekTime, setSeekTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    fetchVideoPosition();
    const interval = setInterval(fetchVideoPosition, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  return (
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
        <button className="trigger-button" onClick={handlePlay} disabled={loading}>
          ▶️ Play
        </button>
        <button className="trigger-button" onClick={handlePause} disabled={loading}>
          ⏸️ Pause
        </button>
      </div>

      <form onSubmit={handleSeek} className="seek-form">
        <div className="seek-row">
          <input
            type="text"
            placeholder="MM:SS or HH:MM:SS"
            value={seekTime}
            onChange={(e) => setSeekTime(e.target.value)}
            className="seek-input"
          />
          <button type="submit" className="trigger-button" disabled={loading || !seekTime}>
            Seek
          </button>
        </div>
      </form>

      <div className="quick-seek">
        <p className="quick-seek-label">Quick Seek:</p>
        <div className="button-grid">
          <button
            className="trigger-button btn-small"
            onClick={() => quickSeek("0:00")}
            disabled={loading}
          >
            Start (0:00)
          </button>
          <button
            className="trigger-button eruption btn-small"
            onClick={() => quickSeek("30:41")}
            disabled={loading}
          >
            Eruption (30:41)
          </button>
        </div>
      </div>

      {message && <div className="warning-message">{message}</div>}
    </div>
  );
}
