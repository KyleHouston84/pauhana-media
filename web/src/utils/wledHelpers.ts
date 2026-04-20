export function rssiLabel(rssi?: number): string {
  if (rssi === undefined) return "—";
  if (rssi >= -50) return `Excellent (${rssi} dBm)`;
  if (rssi >= -65) return `Good (${rssi} dBm)`;
  if (rssi >= -75) return `Fair (${rssi} dBm)`;
  return `Poor (${rssi} dBm)`;
}

export function brightnessPercent(bri?: number): string {
  if (bri === undefined) return "—";
  return `${Math.round((bri / 255) * 100)}%`;
}
