import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LIGHTING, RED } from "./json/wledStates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIBRARY_PATH = path.join(__dirname, "../../effect-library.json");

export interface StoredEffect {
  name: string;
  state: Record<string, unknown>;
  capturedFromIp?: string;
  capturedAt: string;
}

type EffectLibrary = Record<string, StoredEffect>;

let library: EffectLibrary = {};

try {
  const data = readFileSync(LIBRARY_PATH, "utf-8");
  library = JSON.parse(data) as EffectLibrary;
  console.log(`Loaded ${Object.keys(library).length} effect(s) from library`);
} catch {
  // file doesn't exist yet — start with empty library
}

// Seed built-in effects on first run (don't overwrite user-saved versions)
let seeded = false;
if (!library["LIGHTING"]) {
  library["LIGHTING"] = {
    name: "LIGHTING",
    state: LIGHTING as unknown as Record<string, unknown>,
    capturedAt: new Date().toISOString(),
  };
  seeded = true;
}
if (!library["RED"]) {
  library["RED"] = {
    name: "RED",
    state: RED as unknown as Record<string, unknown>,
    capturedAt: new Date().toISOString(),
  };
  seeded = true;
}

function persist(): void {
  writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

if (seeded) persist();

export function getEffects(): EffectLibrary {
  return library;
}

export function getEffect(name: string): StoredEffect | undefined {
  return library[name];
}

export function saveEffect(
  name: string,
  state: Record<string, unknown>,
  capturedFromIp?: string,
): StoredEffect {
  library[name] = { name, state, capturedFromIp, capturedAt: new Date().toISOString() };
  persist();
  return library[name];
}

export function updateEffect(
  oldName: string,
  updates: { name?: string; state?: Record<string, unknown>; capturedFromIp?: string },
): StoredEffect | null {
  if (!library[oldName]) return null;
  const newName = updates.name?.trim() || oldName;
  const existing = library[oldName];
  const updated: StoredEffect = {
    name: newName,
    state: updates.state ?? existing.state,
    capturedFromIp: updates.capturedFromIp ?? existing.capturedFromIp,
    capturedAt: updates.state ? new Date().toISOString() : existing.capturedAt,
  };
  if (newName !== oldName) delete library[oldName];
  library[newName] = updated;
  persist();
  return updated;
}

export function deleteEffect(name: string): boolean {
  if (!library[name]) return false;
  delete library[name];
  persist();
  return true;
}
