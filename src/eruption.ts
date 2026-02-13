import { sonos, snapshotSonos, fadeVolume, playEffect } from "./sonos.js";
import { ERUPTION_VOLUME, EVENTS } from "./common/constants.js";
import { sleep } from "./common/helpers.js";
import { pauhanaWLED } from "./wled.js";

// Hue lightning effects commented out in original code (lines 30-32)
// import { setLights } from "./hue.js";
// const ALL_LIGHTS = [1, 2, 3, 4];

export async function startEruption(): Promise<void> {
  pauhanaWLED.assignZones({ volcano: ["WLED-Gledopto"] });

  const snap = await snapshotSonos();
  const eventVolume = Math.max(snap.volume, ERUPTION_VOLUME);

  const { uri } = EVENTS.ERUPTION;
  await playEffect(uri, snap, eventVolume);

  pauhanaWLED.volcanoGlow();
  // await lightningStrike();
  // await sleep(3000);
  // await lightningStrike();

  await sleep(86000);
  // await sleep(10000);
  if (snap.track?.uri) {
    await sonos.selectTrack(snap.track.queuePosition);
    await sonos.seek(snap.track.position);
  }

  await pauhanaWLED.reset();
  await sonos.play();
  await fadeVolume(eventVolume, snap.volume, 3000);
}
