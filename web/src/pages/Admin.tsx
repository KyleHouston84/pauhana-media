import { VideoControls } from "../components/VideoControls";
import { SystemSettings } from "../components/SystemSettings";
import { WLEDDevices } from "../components/WLEDDevices";
import { EventConfig } from "../components/EventConfig";
import { SystemLogs } from "../components/SystemLogs";
import "../App.css";

export function Admin() {
  return (
    <>
      <div className="card-container">
        <VideoControls />
        <SystemSettings />
        <WLEDDevices />

        <EventConfig />

        <SystemLogs />
      </div>
    </>
  );
}
