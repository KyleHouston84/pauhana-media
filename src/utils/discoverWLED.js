import axios from "axios";
import pMap from "p-map";
import { getLocalSubnet } from "./getLocalSubnet.js";

// Discover WLED devices via HTTP scan
export async function discoverWLED() {
  const subnet = getLocalSubnet();
  const ips = Array.from({ length: 254 }, (_, i) => `${subnet}${i + 1}`);

  const results = await pMap(
    ips,
    async (ip) => {
      try {
        const res = await axios.get(`http://${ip}/json`, { timeout: 200 });
        if (res.data?.info?.ver) {
          return { ip, name: res.data.info.name };
        }
      } catch {}
    },
    { concurrency: 50 } // adjust for Pi performance
  );

  return results.filter(Boolean);
}
