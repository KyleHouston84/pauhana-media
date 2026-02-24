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
