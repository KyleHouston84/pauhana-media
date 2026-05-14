import { sonos, snapshotSonos, fadeVolume, playEffect } from "./sonos.js";
import { EVENTS } from "./common/constants.js";
import { sleep } from "./common/helpers.js";
import { pauhanaWLED } from "./wled.js";
import { seekVideo } from "./video.js";
import { getEventSettings } from "./eventSettings.js";

// Hue lightning effects commented out in original code (lines 30-32)
// import { setLights } from "./hue.js";
// const ALL_LIGHTS = [1, 2, 3, 4];

export async function summonStorm(): Promise<void> {
  const { volume, durationSec, videoSeekTime } = getEventSettings().STORM;

  if (videoSeekTime) await seekVideo(videoSeekTime);

  pauhanaWLED.assignZones({ storm: getEventSettings().STORM.wled.devices.map((d) => d.name) });

  const snap = await snapshotSonos();
  const eventVolume = Math.max(snap.volume, volume);

  const { uri } = EVENTS.STORM;
  await playEffect(uri, snap, eventVolume);

  await pauhanaWLED.triggerStorm();

  try {
    await sleep(durationSec * 1000);
    await sonos.selectQueue();
    if (snap.track?.uri) {
      await sonos.selectTrack(snap.track.queuePosition);
      await sonos.seek(snap.track.position);
    }
  } finally {
    await pauhanaWLED.reset();
  }

  await sonos.play();
  await fadeVolume(eventVolume, snap.volume, 5000);
}
