import 'dotenv/config';

const required = ['API_KEY', 'SONOS_MAIN_IP', 'SONOS_SECONDARY_IP', 'HUE_BRIDGE_IP', 'HUE_USERNAME'];

export function validateEnv(): void {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const config = {
  apiKey: process.env.API_KEY!,
  sonos: {
    mainIp: process.env.SONOS_MAIN_IP!,
    secondaryIp: process.env.SONOS_SECONDARY_IP!
  },
  hue: {
    bridgeIp: process.env.HUE_BRIDGE_IP!,
    username: process.env.HUE_USERNAME!
  }
} as const;
