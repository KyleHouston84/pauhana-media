import axios from "axios";
import { discoverWLED } from "./utils/discoverWLED.js";
import { LIGHTING, RED } from "./json/wledStates.js";
import { getEffect } from "./effectLibrary.js";
import { getEventSettings } from "./eventSettings.js";
import type {
  WLEDDevice,
  WLEDState,
  WLEDZoneType,
  WLEDZones,
} from "./types/wled.js";

interface WLEDSnapshotEntry {
  device: WLEDDevice;
  state: WLEDState;
}

export class PauHanaWLED {
  devices: WLEDDevice[];
  zones: WLEDZones;
  snapshot: Record<string, WLEDSnapshotEntry>;

  constructor() {
    this.devices = []; // all discovered devices
    this.zones = {
      volcano: [],
      storm: [],
      ambient: [],
    };
    this.snapshot = {}; // snapshot of the current state by ip
  }

  async discover(): Promise<WLEDDevice[]> {
    this.devices = await discoverWLED();
    if (this.devices.length > 0) {
      console.log("Discovered WLEDs:", this.devices);
    } else {
      console.log("Unable to locate WLEDs", this.devices);
    }
    return this.devices;
  }

  // Assign devices to zones by name (or manually)
  assignZones(zoneMapping: Record<string, string[]> = {}): void {
    // Reset zones
    Object.keys(this.zones).forEach(
      (zone) => (this.zones[zone as WLEDZoneType] = []),
    );

    this.devices.forEach((device) => {
      for (const [zone, names] of Object.entries(zoneMapping)) {
        if (names.includes(device.name)) {
          this.zones[zone as WLEDZoneType].push(device);
        }
      }
    });
  }

  // Send command to a single WLED device
  async sendCommand(device: WLEDDevice, command: string): Promise<void> {
    try {
      await axios.get(`http://${device.ip}/win&T=${command}`, { timeout: 500 });
    } catch (e) {
      console.error(`Failed to send command to ${device.name} at ${device.ip}`);
    }
  }

  // Send json command to a single WLED device
  async sendJSON(device: WLEDDevice, json: WLEDState): Promise<void> {
    try {
      await axios.post<WLEDState>(`http://${device.ip}/json/state`, json);
    } catch (error) {
      console.error("Failed to send JSON", error);
    }
  }

  async saveSnapshot(): Promise<boolean> {
    for (const device of this.devices) {
      try {
        const res = await axios.get<WLEDState>(
          `http://${device.ip}/json/state`,
          {
            timeout: 200,
          },
        );
        if (res.data) {
          this.snapshot[device.ip] = { device: device, state: res.data };
        }
      } catch (error) {
        console.error("Error saving snapshot", error);
      }
    }
    return true;
  }

  // Trigger storm effect on all storm devices (per-device effect lookup)
  async triggerStorm(): Promise<void> {
    await this.saveSnapshot();
    const assignments = getEventSettings().STORM.wled.devices;
    for (const assignment of assignments) {
      const device = this.zones.storm.find((d) => d.name === assignment.name);
      if (!device) continue;
      const effectState = (getEffect(assignment.effect)?.state ?? LIGHTING) as unknown as WLEDState;
      await this.sendJSON(device, effectState);
    }
    console.log("WLED Storm triggered!");
  }

  // Trigger volcano glow (per-device effect lookup)
  async volcanoGlow(): Promise<void> {
    await this.saveSnapshot();
    const assignments = getEventSettings().ERUPTION.wled.devices;
    for (const assignment of assignments) {
      const device = this.zones.volcano.find((d) => d.name === assignment.name);
      if (!device) continue;
      const effectState = (getEffect(assignment.effect)?.state ?? RED) as unknown as WLEDState;
      await this.sendJSON(device, effectState);
    }
    console.log("WLED Volcano glow triggered!");
  }

  // Reset to snapshot state
  async reset(): Promise<void> {
    for (const snap in this.snapshot) {
      const { device, state } = this.snapshot[snap];
      await this.sendJSON(device, state);
    }
    console.log("WLED snapshot reset complete");
  }
}

export const pauhanaWLED = new PauHanaWLED();
