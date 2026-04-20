import { sonos, snapshotSonos, fadeVolume, playEffect } from "./sonos.js";
import { EVENTS } from "./common/constants.js";
import { sleep } from "./common/helpers.js";
import { pauhanaWLED } from "./wled.js";
import { getEventSettings } from "./eventSettings.js";

// Hue lightning effects commented out in original code (lines 30-32)
// import { setLights } from "./hue.js";
// const ALL_LIGHTS = [1, 2, 3, 4];

export async function summonStorm(): Promise<void> {
  pauhanaWLED.assignZones({ storm: getEventSettings().STORM.wled.deviceNames });

  const snap = await snapshotSonos();
  const { volume, durationSec } = getEventSettings().STORM;
  const eventVolume = Math.max(snap.volume, volume);

  const { uri } = EVENTS.STORM;
  await playEffect(uri, snap, eventVolume);

  pauhanaWLED.triggerStorm();
  // await lightningStrike();
  // await sleep(3000);
  // await lightningStrike();

  await sleep(durationSec * 1000);
  await sonos.selectQueue();
  if (snap.track?.uri) {
    await sonos.selectTrack(snap.track.queuePosition);
    await sonos.seek(snap.track.position);
  }

  await pauhanaWLED.reset();
  await sonos.play();
  await fadeVolume(eventVolume, snap.volume, 5000);
}
