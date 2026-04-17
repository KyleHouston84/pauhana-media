import { useState, useEffect } from "react";
import { getRandomEventsEnabled, setRandomEventsEnabled } from "../api";

export function SystemSettings() {
  const [randomEventsEnabled, setRandomEventsEnabledState] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [nextEventTime, setNextEventTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [message, setMessage] = useState("");

  const fetchRandomEventsState = async () => {
    try {
      const data = await getRandomEventsEnabled();
      setRandomEventsEnabledState(data.enabled);
      setNextEventTime(data.nextEventTime || null);
    } catch (err) {
      console.error("Failed to get random events state:", err);
    }
  };

  useEffect(() => {
    fetchRandomEventsState();
  }, []);

  // Update countdown every second and refetch next event time every 30 seconds
  useEffect(() => {
    const updateCountdown = () => {
      if (!randomEventsEnabled) {
        setCountdown("Disabled");
        return;
      }

      if (!nextEventTime) {
        setCountdown("Calculating...");
        return;
      }

      const now = Date.now();
      const timeLeft = nextEventTime - now;

      if (timeLeft <= 0) {
        setCountdown("Any moment now...");
        return;
      }

      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);

      if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    const refetchInterval = setInterval(fetchRandomEventsState, 30000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refetchInterval);
    };
  }, [randomEventsEnabled, nextEventTime]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRandomEventsToggle = async () => {
    setSettingsLoading(true);
    try {
      const newState = !randomEventsEnabled;
      const result = await setRandomEventsEnabled(newState);
      setRandomEventsEnabledState(result.enabled);
      setNextEventTime(result.nextEventTime || null);
      showMessage(
        result.message ||
          (newState ? "Random events enabled" : "Random events disabled"),
      );
    } catch (err) {
      showMessage("Failed to update random events setting");
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>⚙️ System Settings</h2>

      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Random Events</h3>
            <p className="setting-description">
              Automatically trigger random storm or eruption events when music
              is playing
            </p>
            {countdown && (
              <p className="countdown-display">
                Next event: <span className="countdown-time">{countdown}</span>
              </p>
            )}
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

      {message && (
        <div className="warning-message" style={{ marginTop: "1rem" }}>
          {message}
        </div>
      )}

      <p className="placeholder-text" style={{ marginTop: "1rem" }}>
        Coming soon: Volume controls, event intervals, WLED configuration
      </p>
    </div>
  );
}
