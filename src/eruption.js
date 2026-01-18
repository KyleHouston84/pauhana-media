import { setLights } from "./hue.js";
import { sonos, snapshotSonos, fadeVolume, playEffect } from "./sonos.js";
import { ERUPTION_VOLUME, EVENTS } from "./common/constants.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALL_LIGHTS = [1, 2, 3, 4];

async function lightningStrike() {
  await setLights(ALL_LIGHTS, { sat: 0, bri: 254, transitiontime: 1 });
  await sleep(100);
  await setLights(ALL_LIGHTS, {
    hue: 47000,
    sat: 200,
    bri: 40,
    transitiontime: 10,
  });
}

export async function startEruption() {
  const snap = await snapshotSonos();
  const eventVolume = Math.max(snap.volume, ERUPTION_VOLUME);
  const { uri } = EVENTS.ERUPTION;

  await playEffect(uri, snap, eventVolume);

  // await lightningStrike();
  // await sleep(3000);
  // await lightningStrike();

  await sleep(10000);
  // await sleep(86000);
  if (snap.track?.uri) {
    await sonos.selectTrack(snap.track.queuePosition);
    await sonos.seek(snap.track.position);
  } else {
    await sonos.play();
  }

  await fadeVolume(eventVolume, snap.volume, 3000);
}
