import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
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

const DEVICE_STORE_PATH = join(process.cwd(), "wled-devices.json");

function loadStoredDevices(): WLEDDevice[] {
  try {
    return JSON.parse(readFileSync(DEVICE_STORE_PATH, "utf8")) as WLEDDevice[];
  } catch {
    return [];
  }
}

function saveDevices(devices: WLEDDevice[]): void {
  try {
    writeFileSync(DEVICE_STORE_PATH, JSON.stringify(devices, null, 2));
  } catch (err) {
    console.error("Failed to save WLED device list:", err);
  }
}

interface WLEDSnapshotEntry {
  device: WLEDDevice;
  state: WLEDState;
}

export class PauHanaWLED {
  devices: WLEDDevice[];
  zones: WLEDZones;
  snapshot: Record<string, WLEDSnapshotEntry>;

  constructor() {
    this.devices = loadStoredDevices(); // seed from last known device list
    this.zones = {
      volcano: [],
      storm: [],
      ambient: [],
    };
    this.snapshot = {};
  }

  async discover(): Promise<WLEDDevice[]> {
    const fresh = await discoverWLED();

    // Merge: fresh discovery wins for any device it found by IP or name.
    // Stored devices are kept as fallback only if neither their IP nor their
    // name appears in the fresh scan — this handles both transient WiFi blips
    // (same IP, temporarily offline) and IP address changes (same name, new IP).
    const freshIPs = new Set(fresh.map((d) => d.ip));
    const freshNames = new Set(fresh.map((d) => d.name));
    const stored = loadStoredDevices();
    const fallback = stored.filter((d) => !freshIPs.has(d.ip) && !freshNames.has(d.name));
    this.devices = [...fresh, ...fallback];

    if (this.devices.length > 0) {
      console.log("WLED devices:", this.devices);
    } else {
      console.log("No WLED devices found");
    }

    saveDevices(this.devices);
    return this.devices;
  }

  persistDevices(): void {
    saveDevices(this.devices);
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
      await axios.post<WLEDState>(`http://${device.ip}/json/state`, json, { timeout: 3000 });
    } catch (error) {
      console.error(`Failed to send JSON to ${device.name} (${device.ip}):`, error);
    }
  }

  async saveSnapshot(): Promise<boolean> {
    for (const device of this.devices) {
      try {
        const res = await axios.get<WLEDState>(
          `http://${device.ip}/json/state`,
          { timeout: 3000 },
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
