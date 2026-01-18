import "dotenv/config";
import { Sonos } from "sonos";
import { SONOS_STEPS } from "./common/constants.js";

export const sonos = new Sonos(process.env.SONOS_IP);

export async function snapshotSonos() {
  const volume = await sonos.getVolume();
  const state = await sonos.getCurrentState();
  const queue = await sonos.getQueue();

  let track = null;
  try {
    track = await sonos.currentTrack();
  } catch {}

  return {
    volume,
    state,
    track,
    queue,
  };
}

export async function fadeVolume(from, to, duraionMs) {
  const stepTime = duraionMs / SONOS_STEPS;
  const delta = (to - from) / SONOS_STEPS;

  let vol = from;
  for (let index = 0; index < SONOS_STEPS; index++) {
    await sonos.setVolume(Math.round(vol));
    vol += delta;
    await new Promise((r) => setTimeout(r, stepTime));
  }
}

export async function playEffect(uri, snap, eventVolume) {
  await fadeVolume(snap.volume, 1, 3000);
  await sonos.play(uri);
  await fadeVolume(1, eventVolume, 1500);
}
