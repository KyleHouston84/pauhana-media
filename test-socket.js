// Test mpv socket connection
const { Socket } = require("net");

const MPV_SOCKET_PATH = "/tmp/mpv-socket";

async function testSeek() {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let responseData = "";

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err.message);
      console.error("Full error:", err);
      reject(err);
    });

    socket.on("data", (data) => {
      responseData += data.toString();
      console.log("✅ Received data:", responseData);
    });

    socket.on("end", () => {
      console.log("✅ Socket ended");
      resolve();
    });

    console.log("🔌 Attempting to connect to:", MPV_SOCKET_PATH);
    socket.connect({ path: MPV_SOCKET_PATH }, () => {
      console.log("✅ Connected!");
      const command = ["seek", "1841", "absolute"];
      const message = JSON.stringify({ command }) + "\n";
      console.log("📤 Sending:", message.trim());
      socket.write(message);
      socket.end();
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      console.warn("⚠️  Timeout");
      resolve();
    });
  });
}

testSeek().then(() => {
  console.log("✅ Test complete");
  process.exit(0);
}).catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
