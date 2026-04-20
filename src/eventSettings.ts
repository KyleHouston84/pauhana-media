import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface EventWLEDConfig {
  deviceNames: string[];
  effect: string;
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
    wled: { deviceNames: ["WLED-Gledopto"], effect: "LIGHTING" },
  },
  ERUPTION: {
    volume: 15,
    durationSec: 86,
    videoSeekTime: "30:41",
    enabled: true,
    wled: { deviceNames: ["WLED-Gledopto"], effect: "RED" },
  },
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = path.join(__dirname, "../event-settings.json");

let settings: Record<string, RuntimeEventConfig> = structuredClone(DEFAULTS);

try {
  const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
  const saved = JSON.parse(raw) as Record<string, Partial<RuntimeEventConfig>>;
  for (const [type, defaults] of Object.entries(DEFAULTS)) {
    settings[type] = {
      ...defaults,
      ...(saved[type] ?? {}),
      wled: { ...defaults.wled, ...(saved[type]?.wled ?? {}) },
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
    wled: { ...settings[type].wled, ...(patch.wled ?? {}) },
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
  return settings[type];
}
