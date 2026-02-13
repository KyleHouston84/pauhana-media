// API client for Pau Hana Media backend

const API_BASE = import.meta.env.DEV ? 'http://localhost:9001' : '';
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
