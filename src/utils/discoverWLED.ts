import axios from "axios";
import pMap from "p-map";
import { getLocalSubnet } from "./getLocalSubnet.js";
import type { WLEDDevice } from "../types/wled.js";

// Discover WLED devices via HTTP scan
export async function discoverWLED(): Promise<WLEDDevice[]> {
  const subnet = getLocalSubnet();
  const ips = Array.from({ length: 254 }, (_, i) => `${subnet}${i + 1}`);

  const results = await pMap(
    ips,
    async (ip): Promise<WLEDDevice | undefined> => {
      try {
        const res = await axios.get<{ info?: { ver?: string; name?: string } }>(
          `http://${ip}/json`,
          { timeout: 2000 }, // Increased from 200ms to 2s for slower networks/devices
        );
        if (res.data?.info?.ver) {
          return { ip, name: res.data.info.name || "Unknown" };
        }
      } catch {
        // Ignore connection errors - most IPs won't have WLED devices
      }
      return undefined;
    },
    { concurrency: 50 }, // adjust for Pi performance
  );

  return results.filter((device): device is WLEDDevice => device !== undefined);
}
