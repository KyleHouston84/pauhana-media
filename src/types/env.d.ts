declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      SONOS_MAIN_IP: string;
      SONOS_SECONDARY_IP: string;
      HUE_BRIDGE_IP: string;
      HUE_USERNAME: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
