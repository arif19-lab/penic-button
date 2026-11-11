const http = require("http");
const fs = require("fs");

module.exports = {
  declaration: {
    name: "trigger_panic",
    description: "Toggles emergency panic defense: sounds intruder alarm, hides active windows, and switches to the safe virtual desktop.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  },

  async execute() {
    return new Promise((resolve) => {
      // Trigger via local PanicButton C++ server endpoint
      let key = "imran2024";
      try {
        key = fs.readFileSync("C:\\ProgramData\\PanicButton\\auth.key", "utf8").trim() || key;
      } catch (e) {}
      const req = http.get("http://127.0.0.1:8085/panic?key=" + encodeURIComponent(key), { timeout: 3000 }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          resolve({
            success: res.statusCode === 200,
            message: "Emergency Panic defense sequence activated.",
            response: body
          });
        });
      });

      req.on("error", (err) => {
        // Fallback: If C++ server is unreachable, use keyboard shortcut emulation
        resolve({
          success: false,
          error: "Panic server communication note: " + err.message
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ success: false, error: "Panic trigger timed out." });
      });
    });
  }
};
