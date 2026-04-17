import { Sonos } from "sonos";
import { SONOS_STEPS } from "./common/constants.js";
import { config } from "./config.js";
import type { SonosSnapshot } from "./types/events.js";
import type { Track } from "sonos";

export const sonos = new Sonos(config.sonos.mainIp);
export const sonos2 = new Sonos(config.sonos.secondaryIp);

export async function snapshotSonos(): Promise<SonosSnapshot> {
  const volume = await sonos.getVolume();
  const state = await sonos.getCurrentState();
  const queue = await sonos.getQueue();

  let track: Track | null = null;
  try {
    track = await sonos.currentTrack();
  } catch {
    // Track might not be available
  }

  return {
    volume,
    state,
    track: track
      ? {
          uri: track.uri,
          position: track.position,
          queuePosition: track.queuePosition,
          artist: track.artist,
          title: track.title,
          album: track.album,
          albumArtURI: track.albumArtURI,
        }
      : null,
    queue,
  };
}

export async function fadeVolume(
  from: number,
  to: number,
  durationMs: number,
): Promise<void> {
  const stepTime = durationMs / SONOS_STEPS;
  const delta = (to - from) / SONOS_STEPS;

  let vol = from;
  for (let index = 0; index < SONOS_STEPS; index++) {
    await sonos.setVolume(Math.round(vol));
    await sonos2.setVolume(Math.round(vol));
    vol += delta;
    await new Promise((r) => setTimeout(r, stepTime));
  }
}

export async function playEffect(
  uri: string,
  snap: SonosSnapshot,
  eventVolume: number,
): Promise<void> {
  await fadeVolume(snap.volume, 1, 3000);
  await sonos.setAVTransportURI(uri);
  await fadeVolume(1, eventVolume, 1500);
}
