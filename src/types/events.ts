export type EventType = 'STORM' | 'ERUPTION';

export interface EventConfig {
  name: string;
  uri: string;
  logStart: string;
  logEnd: string;
}

export interface SonosSnapshot {
  volume: number;
  state: 'playing' | 'paused' | 'stopped' | 'transitioning';
  track: {
    uri: string;
    position: string;
    queuePosition: number;
    artist?: string;
    title?: string;
    album?: string;
    albumArtURI?: string;
  } | null;
  queue: any[];
}
