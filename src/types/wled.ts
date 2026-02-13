export interface WLEDDevice {
  ip: string;
  name: string;
}

export interface WLEDState {
  on?: boolean;
  bri?: number;
  seg?: Array<{
    id?: number;
    fx?: number;
    sx?: number;
    col?: number[][];
  }>;
  transition?: number;
}

export type WLEDZoneType = 'volcano' | 'storm' | 'ambient';

export interface WLEDSnapshot {
  ip: string;
  state: WLEDState;
}

export interface WLEDZones {
  volcano: WLEDDevice[];
  storm: WLEDDevice[];
  ambient: WLEDDevice[];
}
