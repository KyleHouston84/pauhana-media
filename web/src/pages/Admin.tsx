import { VideoControls } from "../components/VideoControls";
import { SystemSettings } from "../components/SystemSettings";
import { WLEDDevices } from "../components/WLEDDevices";
import { SystemLogs } from "../components/SystemLogs";
import "../App.css";

export function Admin() {
  return (
    <>
      <div className="card-container">
        <VideoControls />
        <SystemSettings />
        <WLEDDevices />

        {/* Event Settings Placeholder */}
        <div className="card">
          <h2>🌩️ Event Configuration</h2>
          <p className="placeholder-text">
            Coming soon: Storm duration, eruption effects, sound levels
          </p>
        </div>

        <SystemLogs />
      </div>
    </>
  );
}
