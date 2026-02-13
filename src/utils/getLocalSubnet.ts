import os from "os";

// Get the local subnet
export function getLocalSubnet(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;

    for (const iface of ifaceList) {
      // IPv4, not internal
      if (iface.family === "IPv4" && !iface.internal) {
        const ipParts = iface.address.split(".");
        // Return subnet, e.g. 192.168.1.
        return ipParts.slice(0, 3).join(".") + ".";
      }
    }
  }
  throw new Error("No valid IPv4 interface found");
}
