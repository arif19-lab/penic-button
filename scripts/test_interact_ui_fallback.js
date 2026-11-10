const path = require('path');
const interactUi = require(path.join(__dirname, '..', 'gemini-proxy', 'core', 'interact_ui'));

async function test() {
  console.log("Testing interact_ui with stringified steps in 'value' (reproducing Gemini payload)...");
  const res = await interactUi.execute({
    action: 'run_sequence',
    app_name: 'Notepad',
    value: JSON.stringify([
      { action: 'set_text', value: 'Fallback parsing verification passed!\n' }
    ])
  });
  console.log("Result:", JSON.stringify(res, null, 2));
}

test();
