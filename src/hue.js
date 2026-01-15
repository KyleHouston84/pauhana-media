import 'dotenv/config'; 
import fetch from "node-fetch";

const BRIDGE_IP = process.env.HUE_BRIDGE_IP;
const USERNAME = process.env.HUE_USERNAME;

export async function setLights(lightIds, state) {
  await Promise.all(
    lightIds.map(id =>
      fetch(`http://${BRIDGE_IP}/api/${USERNAME}/lights/${id}/state`, {
        method: "PUT",
        body: JSON.stringify(state),
      })
    )
  );
}
