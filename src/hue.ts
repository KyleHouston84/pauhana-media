import fetch from "node-fetch";
import { config } from "./config.js";
import type { HueLightState } from "./types/hue.js";

const BRIDGE_IP = config.hue.bridgeIp;
const USERNAME = config.hue.username;

export async function setLights(lightIds: number[], state: HueLightState): Promise<void> {
  await Promise.all(
    lightIds.map(id =>
      fetch(`http://${BRIDGE_IP}/api/${USERNAME}/lights/${id}/state`, {
        method: "PUT",
        body: JSON.stringify(state),
      })
    )
  );
}
