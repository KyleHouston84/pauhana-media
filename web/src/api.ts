// API client for Pau Hana Media backend

// Use empty string (relative URLs) in both dev and production
// In dev: Vite proxy forwards to localhost:9001
// In production: Same origin, served by Express
const API_BASE = '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface HealthResponse {
  status: string;
  stormActive: boolean;
  sonos: {
    state: string;
    volume: number;
    track: {
      artist?: string;
      title?: string;
      album?: string;
      albumArtURI?: string;
    } | null;
  };
}

interface TriggerResponse {
  ok: boolean;
  message: string;
}

interface VideoResponse {
  ok: boolean;
  message?: string;
  position?: number;
}

interface RandomEventsResponse {
  ok: boolean;
  enabled: boolean;
  nextEventTime?: number | null;
  message?: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Failed to fetch health');
  return response.json();
}

export async function triggerStorm(): Promise<TriggerResponse> {
  const response = await fetch(`${API_BASE}/storm`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to trigger storm');
  return response.json();
}

export async function triggerEruption(): Promise<TriggerResponse> {
  const response = await fetch(`${API_BASE}/erupt`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to trigger eruption');
  return response.json();
}

// Video Control Functions
export async function playVideo(): Promise<VideoResponse> {
  const response = await fetch(`${API_BASE}/video/play`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to play video');
  return response.json();
}

export async function pauseVideo(): Promise<VideoResponse> {
  const response = await fetch(`${API_BASE}/video/pause`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to pause video');
  return response.json();
}

export async function seekVideo(timestamp: string): Promise<VideoResponse> {
  const response = await fetch(`${API_BASE}/video/seek`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timestamp }),
  });
  if (!response.ok) throw new Error('Failed to seek video');
  return response.json();
}

export async function getVideoPosition(): Promise<VideoResponse> {
  const response = await fetch(`${API_BASE}/video/position`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to get video position');
  return response.json();
}

export async function getDisplayPower(): Promise<{ ok: boolean; on: boolean }> {
  const response = await fetch(`${API_BASE}/video/display`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) throw new Error('Failed to get display power state');
  return response.json();
}

export async function setDisplayPower(on: boolean): Promise<{ ok: boolean; on: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/video/display`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ on }),
  });
  if (!response.ok) throw new Error('Failed to set display power state');
  return response.json();
}

// Random Events Settings Functions
export async function getRandomEventsEnabled(): Promise<RandomEventsResponse> {
  const response = await fetch(`${API_BASE}/settings/random-events`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to get random events state');
  return response.json();
}

export async function setRandomEventsEnabled(enabled: boolean): Promise<RandomEventsResponse> {
  const response = await fetch(`${API_BASE}/settings/random-events`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) throw new Error('Failed to set random events state');
  return response.json();
}

// Event Configuration Functions
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

export async function getEvents(): Promise<{ ok: boolean; events: Record<string, RuntimeEventConfig> }> {
  const response = await fetch(`${API_BASE}/events`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

export async function updateEvent(
  type: string,
  patch: Partial<RuntimeEventConfig>,
): Promise<{ ok: boolean; config: RuntimeEventConfig }> {
  const response = await fetch(`${API_BASE}/events/${type}`, {
    method: 'PATCH',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Failed to update event ${type}`);
  return response.json();
}

// WLED Functions
export interface WLEDDevice {
  ip: string;
  name: string;
}

interface WLEDDevicesResponse {
  ok: boolean;
  devices: WLEDDevice[];
  count: number;
  message?: string;
}

export async function getWLEDDevices(): Promise<WLEDDevicesResponse> {
  const response = await fetch(`${API_BASE}/wled/devices`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch WLED devices');
  return response.json();
}

export async function discoverWLEDDevices(): Promise<WLEDDevicesResponse> {
  const response = await fetch(`${API_BASE}/wled/discover`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('WLED discovery failed');
  return response.json();
}

export interface WLEDDeviceInfo {
  ip: string;
  name: string;
  version?: string;
  ledCount?: number;
  rssi?: number;
  on?: boolean;
  brightness?: number;
}

export async function getWLEDDeviceInfo(ip: string): Promise<WLEDDeviceInfo> {
  const response = await fetch(`${API_BASE}/wled/devices/${ip}/info`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) throw new Error(`Failed to fetch info for ${ip}`);
  const data = await response.json();
  return data.info as WLEDDeviceInfo;
}

export async function setWLEDPower(ip: string, on: boolean): Promise<{ ok: boolean; on: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/wled/devices/${ip}/power`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ on }),
  });
  if (!response.ok) throw new Error('Failed to set WLED power');
  return response.json();
}

export async function renameWLEDDevice(ip: string, name: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/wled/devices/${ip}/rename`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to rename device');
  return response.json();
}

// Effect Library Functions
export interface StoredEffect {
  name: string;
  state: Record<string, unknown>;
  capturedFromIp?: string;
  capturedAt: string;
}

export async function getEffectLibrary(): Promise<{ ok: boolean; effects: Record<string, StoredEffect> }> {
  const response = await fetch(`${API_BASE}/effects`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) throw new Error('Failed to fetch effect library');
  return response.json();
}

export async function captureDeviceEffect(ip: string, name: string): Promise<{ ok: boolean; effect: StoredEffect }> {
  const response = await fetch(`${API_BASE}/effects`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, name }),
  });
  if (!response.ok) throw new Error('Failed to capture effect');
  return response.json();
}

export async function updateEffectInLibrary(
  oldName: string,
  updates: { name?: string; ip?: string },
): Promise<{ ok: boolean; effect: StoredEffect }> {
  const response = await fetch(`${API_BASE}/effects/${encodeURIComponent(oldName)}`, {
    method: 'PATCH',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update effect');
  return response.json();
}

export async function deleteEffectFromLibrary(name: string): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/effects/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': API_KEY },
  });
  if (!response.ok) throw new Error('Failed to delete effect');
  return response.json();
}

// System Logs Functions
export async function getLogs(lines: number = 100): Promise<string> {
  const response = await fetch(`${API_BASE}/logs?lines=${lines}`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch logs');
  return response.text();
}
