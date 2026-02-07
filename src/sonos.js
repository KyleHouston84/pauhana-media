import "dotenv/config";
import { Sonos, AsyncDeviceDiscovery } from "sonos";
import { SONOS_STEPS } from "./common/constants.js";

export const sonos = new Sonos(process.env.SONOS_MAIN_IP);
export const sonos2 = new Sonos(process.env.SONOS_SECONDARY_IP);
const discover = new AsyncDeviceDiscovery();

// discover.discoverMultiple({ timeout: 5000 }).then((devices) => {
//   console.log("Found %d sonos devices", devices.length);
//   devices.forEach((device) => {
//     console.log("Device found: ", device.host);
//   });
// });

// discover
//   .discover()
//   .then((device, model) => {
//     console.log("Found one sonos device %s getting all groups", device.host);
//     return device.getAllGroups().then((groups) => {
//       groups.forEach((group) =>
//         console.log("Device found: ", group.Name, group.host)
//       );
//     });
//   })
//   .catch((e) => {
//     console.warn(" Error in discovery %j", e);
//   });

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
    await sonos2.setVolume(Math.round(vol));
    vol += delta;
    await new Promise((r) => setTimeout(r, stepTime));
  }
}

export async function playEffect(uri, snap, eventVolume) {
  await fadeVolume(snap.volume, 1, 3000);
  await sonos.play(uri);
  await fadeVolume(1, eventVolume, 1500);
}
