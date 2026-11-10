// Quick smoke test for the transparent proxy (run: node ws_smoke_test.js)
const WebSocket = require("ws");

function test(label, url, timeoutMs) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const result = { label, opened: false, closeCode: null, reason: "", messages: 0, firstMsg: "" };
    const timer = setTimeout(() => { try { ws.close(); } catch (e) {} finish(); }, timeoutMs);
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    }
    ws.on("open", () => {
      result.opened = true;
      // Send a minimal Gemini-style setup using the model from GEMINI_CONFIG
      ws.send(JSON.stringify({ setup: { model: "models/gemini-3.1-flash-live-preview", generationConfig: { responseModalities: ["AUDIO"] } } }));
    });
    ws.on("message", (d) => {
      result.messages += 1;
      if (!result.firstMsg) result.firstMsg = d.toString().slice(0, 120);
    });
    ws.on("close", (code, reason) => {
      result.closeCode = code;
      result.reason = (reason || "").toString();
      finish();
    });
    ws.on("error", (err) => { result.reason = "ERR: " + err.message; finish(); });
  });
}

(async () => {
  const r1 = await test("no-key (expect 4001)", "ws://127.0.0.1:3001/ws/live", 6000);
  console.log(JSON.stringify(r1, null, 2));
  process.exit(0);
})();
