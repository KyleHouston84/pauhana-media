import { setLights } from "./hue.js";
import { sonos, snapshotSonos, fadeVolume } from "./sonos.js";

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

export async function summonStorm() {
  const snap = await snapshotSonos();

  await fadeVolume(snap.volume, 15, 3000);
  await sonos.play("http://pauhana-pi.local:3000/thunderstorm.mp3");

  await lightningStrike();
  await sleep(3000);
  await lightningStrike();

  if (snap.track?.uri) {
    await sonos.play(snap.track.uri);
  } else {
    await sonos.play();
  }

  await fadeVolume(15, snap.volume, 5000);
}
