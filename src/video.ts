import { Socket } from "net";

/**
 * Video Controller for mpv IPC
 * Controls the video playback via mpv's JSON IPC socket
 */

const MPV_SOCKET_PATH = "/tmp/mpv-socket";

/**
 * Send a command to mpv via IPC socket
 */
async function sendMpvCommand(command: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let responseData = "";

    socket.on("error", (err) => {
      console.error("❌ mpv socket error:", err.message);
      reject(err);
    });

    socket.on("data", (data) => {
      responseData += data.toString();
    });

    socket.on("end", () => {
      try {
        const response = JSON.parse(responseData);
        if (response.error !== "success") {
          console.warn("⚠️  mpv command warning:", response);
        }
        resolve();
      } catch (err) {
        console.error("❌ Failed to parse mpv response:", err);
        resolve(); // Don't reject - video control is non-critical
      }
    });

    console.log(`🔌 Connecting to socket: ${MPV_SOCKET_PATH}`);
    socket.connect({ path: MPV_SOCKET_PATH }, () => {
      console.log("✅ Socket connected successfully");
      const message = JSON.stringify({ command }) + "\n";
      socket.write(message);
      socket.end();
    });

    // Timeout after 2 seconds
    socket.setTimeout(2000, () => {
      socket.destroy();
      console.warn("⚠️  mpv command timeout");
      resolve(); // Don't reject - video control is non-critical
    });
  });
}

/**
 * Seek to a specific timestamp in the video
 * @param timestamp - Time in format "MM:SS" or "HH:MM:SS" or seconds
 */
/**
 * Parse a timestamp string ("MM:SS" or "HH:MM:SS") or number (seconds) to seconds.
 */
export function parseTimestamp(timestamp: string | number): number {
  if (typeof timestamp === "number") return timestamp;
  const parts = timestamp.split(":").map(Number);
  if (parts.some(isNaN)) throw new Error(`Invalid timestamp format: ${timestamp}`);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  throw new Error(`Invalid timestamp format: ${timestamp}`);
}

export async function seekVideo(timestamp: string | number): Promise<void> {
  try {
    const seconds = parseTimestamp(timestamp);
    console.log(`🎬 Seeking video to ${timestamp} (${seconds}s)`);
    await sendMpvCommand(["seek", seconds.toString(), "absolute"]);
  } catch (err) {
    console.error("❌ Failed to seek video:", err);
    // Non-critical error - don't throw
  }
}

/**
 * Get current playback position
 */
export async function getVideoPosition(): Promise<number | null> {
  try {
    return new Promise((resolve) => {
      const socket = new Socket();
      let responseData = "";

      socket.on("error", () => {
        resolve(null);
      });

      socket.on("data", (data) => {
        responseData += data.toString();
      });

      socket.on("end", () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response.data ?? null);
        } catch {
          resolve(null);
        }
      });

      socket.connect({ path: MPV_SOCKET_PATH }, () => {
        const message =
          JSON.stringify({ command: ["get_property", "time-pos"] }) + "\n";
        socket.write(message);
        socket.end();
      });

      socket.setTimeout(2000, () => {
        socket.destroy();
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

/**
 * Pause video playback
 */
export async function pauseVideo(): Promise<void> {
  try {
    console.log("⏸️  Pausing video");
    await sendMpvCommand(["set_property", "pause", "yes"]);
  } catch (err) {
    console.error("❌ Failed to pause video:", err);
  }
}

/**
 * Resume video playback
 */
export async function playVideo(): Promise<void> {
  try {
    console.log("▶️  Playing video");
    await sendMpvCommand(["set_property", "pause", "no"]);
  } catch (err) {
    console.error("❌ Failed to play video:", err);
  }
}
