import axios from "axios";
import { discoverWLED } from "./utils/discoverWLED.js";
import { LIGHTING, RED } from "./json/wledStates.js";

export class PauHanaWLED {
  constructor() {
    this.devices = []; // all discovered devices
    this.zones = {
      volcano: [],
      storm: [],
      ambient: [],
    };
    this.snapshot = {}; // snapshot of the current state by ip
    console.log("💡 WLED system ready");
  }

  async discover() {
    this.devices = await discoverWLED();
    return this.devices;
  }

  // Assign devices to zones by name (or manually)
  assignZones(zoneMapping = {}) {
    // Reset zones
    Object.keys(this.zones).forEach((zone) => (this.zones[zone] = []));

    this.devices.forEach((device) => {
      for (const [zone, names] of Object.entries(zoneMapping)) {
        if (names.includes(device.name)) {
          this.zones[zone].push(device);
        }
      }
    });
  }

  // Send command to a single WLED device
  async sendCommand(device, command) {
    try {
      await axios.get(`http://${device.ip}/win&T=${command}`, { timeout: 500 });
    } catch (e) {
      console.error(`Failed to send command to ${device.name} at ${device.ip}`);
    }
  }

  // Send json command to a single WLED device
  async sendJSON(device, json) {
    try {
      const res = await axios.post(`http://${device.ip}/json/state`, json);
    } catch (error) {
      console.error("Failed to send JSON", error);
    }
  }

  async saveSnapshot() {
    for (const device of this.devices) {
      try {
        const res = await axios.get(`http://${device.ip}/json/state`, {
          timeout: 200,
        });
        if (res.data) {
          this.snapshot[device.ip] = { device: device, state: res.data };
        }
      } catch (error) {
        console.error("Error saving snapshot", error);
      }
    }
    return true;
  }

  // Trigger storm effect on all storm devices
  async triggerStorm() {
    await this.saveSnapshot();
    for (const device of this.zones.storm) {
      await this.sendJSON(device, LIGHTING);
    }
    console.log("Storm triggered!");
  }

  // Trigger volcano glow
  async volcanoGlow() {
    await this.saveSnapshot();
    for (const device of this.zones.volcano) {
      await this.sendJSON(device, RED);
    }
    console.log("Volcano glow triggered!");
  }

  // Reset to snapshot state
  async reset() {
    for (const snap in this.snapshot) {
      const { device, state } = this.snapshot[snap];
      await this.sendJSON(device, state);
    }
    console.log("WLED snapshot reset complete");
  }
}

export const pauhanaWLED = new PauHanaWLED();
