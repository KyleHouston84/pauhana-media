import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface EventWLEDDeviceAssignment {
  name: string;
  effect: string;
}

export interface EventWLEDConfig {
  devices: EventWLEDDeviceAssignment[];
}

export interface RuntimeEventConfig {
  volume: number;
  durationSec: number;
  videoSeekTime: string | null;
  enabled: boolean;
  wled: EventWLEDConfig;
}

const DEFAULTS: Record<string, RuntimeEventConfig> = {
  STORM: {
    volume: 10,
    durationSec: 60,
    videoSeekTime: null,
    enabled: true,
    wled: { devices: [{ name: "WLED-Gledopto", effect: "LIGHTING" }] },
  },
  ERUPTION: {
    volume: 15,
    durationSec: 86,
    videoSeekTime: "30:41",
    enabled: true,
    wled: { devices: [{ name: "WLED-Gledopto", effect: "RED" }] },
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = path.join(__dirname, "../event-settings.json");

export function migrateWLED(wled: unknown): EventWLEDConfig {
  if (wled && typeof wled === "object") {
    const w = wled as Record<string, unknown>;
    // Old format: { deviceNames: string[], effect: string }
    if (Array.isArray(w.deviceNames)) {
      return {
        devices: (w.deviceNames as string[]).map((name) => ({
          name,
          effect: typeof w.effect === "string" ? w.effect : "LIGHTING",
        })),
      };
    }
    if (Array.isArray(w.devices)) {
      return w as unknown as EventWLEDConfig;
    }
  }
  return { devices: [] };
}

let settings: Record<string, RuntimeEventConfig> = structuredClone(DEFAULTS);

try {
  const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
  const saved = JSON.parse(raw) as Record<string, Partial<RuntimeEventConfig>>;
  for (const [type, defaults] of Object.entries(DEFAULTS)) {
    settings[type] = {
      ...defaults,
      ...(saved[type] ?? {}),
      wled: migrateWLED((saved[type] as Record<string, unknown>)?.wled ?? defaults.wled),
    };
  }
} catch {
  // File doesn't exist yet — use defaults
}

export function getEventSettings(): Record<string, RuntimeEventConfig> {
  return settings;
}

export function updateEventSetting(
  type: string,
  patch: Partial<RuntimeEventConfig>,
): RuntimeEventConfig {
  settings[type] = {
    ...settings[type],
    ...patch,
    wled: patch.wled ?? settings[type].wled,
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
  return settings[type];
}
