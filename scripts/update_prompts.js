const fs = require('fs');
const path = require('path');

// 1. Update server.js
const serverPath = path.join(__dirname, '..', 'gemini-proxy', 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');

// Replace the toolsCatalogPrompt in server.js
server = server.replace(
  /"1\. interact_ui\(action, target, app_name, value\):[^"]+"/m,
  `"1. interact_ui(action, target, app_name, value, steps): Universal Windows UI Automation engine with closed-loop verification. For single actions use action: 'click' / 'set_text'. For multi-step workflows across applications, use action: 'run_sequence' with steps: [{action: 'set_text', value: '...'}, {action: 'click', target: 'File'}, {action: 'click', target: 'Save as'}, {action: 'set_text', target: 'File name:', value: 'C:\\\\\\\\Users\\\\\\\\Imran\\\\\\\\test.txt'}, {action: 'click', target: 'Save'}]. NEVER pass steps as a string inside 'value'; ALWAYS pass the array inside the 'steps' parameter directly."`
);

// Add strict rule against faking UI saves
server = server.replace(
  /"  6\. STRICT PROHIBITION OF BLIND SENDKEYS:[^"]+",/m,
  `"  6. STRICT PROHIBITION OF BLIND SENDKEYS & FAKED UI: NEVER write PowerShell scripts with WScript.Shell, SendKeys, or AppActivate in execute_system_script. NEVER launch apps with -WindowStyle Hidden — all apps must be visible on the desktop screen. NEVER use Set-Content or Out-File in execute_system_script to fake GUI saving; execute real UI clicks and text entry via interact_ui.",`
);

fs.writeFileSync(serverPath, server, 'utf8');
console.log('[OK] server.js updated');

// 2. Update personas.js
const personasPath = path.join(__dirname, '..', 'android-app', 'www', 'js', 'personas.js');
let personas = fs.readFileSync(personasPath, 'utf8');

personas = personas.replace(
  /"10\. AUTONOMOUS MULTI-STEP GUI TASKS & SEQUENCES:[^"]+",/m,
  `"10. AUTONOMOUS MULTI-STEP GUI TASKS & SEQUENCES: When the user asks to complete a multi-step GUI workflow across one or more applications (e.g. typing in Notepad, opening Save As dialog, switching tabs, calculating, pasting, saving), ALWAYS use interact_ui with action: 'run_sequence' and pass the array in the 'steps' parameter: {action: 'run_sequence', app_name: 'Notepad', steps: [{action: 'set_text', value: '...'}, {action: 'click', target: 'File'}, {action: 'click', target: 'Save as'}, {action: 'set_text', target: 'File name:', value: 'C:\\\\Users\\\\Imran\\\\test.txt'}, {action: 'click', target: 'Save'}]}. NEVER pass steps stringified in 'value'. NEVER use -WindowStyle Hidden. NEVER use Set-Content to fake GUI saves. Each step must execute on screen and be verified closed-loop.",`
);

fs.writeFileSync(personasPath, personas, 'utf8');
console.log('[OK] personas.js updated');
