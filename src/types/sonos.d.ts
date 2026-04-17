declare module "sonos" {
  export class Sonos {
    constructor(host: string);
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    getCurrentState(): Promise<
      "playing" | "paused" | "stopped" | "transitioning"
    >;
    getQueue(): Promise<QueueItem[]>;
    currentTrack(): Promise<Track>;
    play(uri?: string): Promise<void>;
    playWithoutQueue(uri?: string): Promise<void>;
    selectTrack(trackNumber: number): Promise<void>;
    seek(position: string): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
  }

  export class AsyncDeviceDiscovery {
    discover(): Promise<{ host: string }>;
  }

  export interface Track {
    uri: string;
    title: string;
    artist: string;
    album: string;
    albumArtURI: string;
    position: string;
    duration: string;
    queuePosition: number;
  }

  export interface QueueItem {
    uri: string;
    title: string;
    artist: string;
    album: string;
    albumArtURI: string;
  }
}
