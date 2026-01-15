import { setLights } from "./hue.js";
import { sonos, snapshotSonos, fadeVolume } from "./sonos.js";
import { ERUPTION_VOLUME } from "./common/constants.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));
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

  await fadeVolume(snap.volume, 1, 3000);
  await sonos.play("http://pauhana-pi.local:9001/audio/eruption.mp3");
  await fadeVolume(snap.volume, ERUPTION_VOLUME, 3000);

  // await lightningStrike();
  // await sleep(3000);
  // await lightningStrike();

  await sleep(60000);
  if (snap.track?.uri) {
    await sonos.play(snap.track.uri);
  } else {
    await sonos.play();
  }

  await fadeVolume(ERUPTION_VOLUME, snap.volume, 5000);
}
