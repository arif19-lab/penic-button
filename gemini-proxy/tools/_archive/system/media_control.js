const { exec } = require("child_process");

const KEY_MAP = {
  play_pause: "0xCD",
  play: "0xCD",
  pause: "0xCD",
  next: "0xB0",
  next_track: "0xB0",
  prev: "0xB1",
  prev_track: "0xB1",
  previous: "0xB1",
  volume_up: "0xAF",
  volume_down: "0xAE",
  mute: "0xAD"
};

module.exports = {
  declaration: {
    name: "media_control",
    description: "Controls Windows audio and media playback (play_pause, next, prev, volume_up, volume_down, mute).",
    parameters: {
      type: "OBJECT",
      properties: {
        action: {
          type: "STRING",
          description: "Media action to perform: 'play_pause', 'next', 'prev', 'volume_up', 'volume_down', 'mute'."
        }
      },
      required: ["action"]
    }
  },

  async execute(args) {
    const action = (args?.action || "play_pause").toLowerCase().trim();
    const vk = KEY_MAP[action] || "0xCD";

    const psScript = `$ws = New-Object -ComObject WScript.Shell; $ws.SendKeys([char]${vk})`;

    return new Promise((resolve) => {
      exec(`powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psScript}"`, { timeout: 5000, windowsHide: true }, (err) => {
        if (err) {
          return resolve({ success: false, action, error: err.message });
        }
        resolve({
          success: true,
          action,
          message: `Media action '${action}' triggered.`
        });
      });
    });
  }
};
