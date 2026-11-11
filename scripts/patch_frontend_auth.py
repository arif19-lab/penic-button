import os, re

# 1. Update gemini_live.js
gl_path = 'android-app/www/js/gemini_live.js'
with open(gl_path, 'r', encoding='utf-8') as f:
    gl_code = f.read()

# Make geminiProxyWsUrl pass the authentication key
old_ws_url_fn = """function geminiProxyWsUrl() {

  if (typeof getWsUrl === "function") {

    return getWsUrl("/gemini-proxy/ws/live");

  }

  var proto = window.location.protocol === "https:" ? "wss:" : "ws:";

  return proto + "//" + window.location.host + "/gemini-proxy/ws/live";

}"""

new_ws_url_fn = """function geminiProxyWsUrl() {
  var k = (typeof KEY !== "undefined" && KEY) ? KEY : (localStorage.getItem("panic_key") || "");
  var query = k ? "?key=" + encodeURIComponent(k) : "";
  if (typeof getWsUrl === "function") {
    return getWsUrl("/gemini-proxy/ws/live" + query);
  }
  var proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return proto + "//" + window.location.host + "/gemini-proxy/ws/live" + query;
}"""

assert old_ws_url_fn in gl_code, "old_ws_url_fn not found in gemini_live.js"
gl_code = gl_code.replace(old_ws_url_fn, new_ws_url_fn)

# Replace 'imran2024' fallbacks in gemini_live.js
gl_code = gl_code.replace('"imran2024"', '""')

with open(gl_path, 'w', encoding='utf-8') as f:
    f.write(gl_code)
print("gemini_live.js updated!")

# 2. Update controls.js
ctrl_path = 'android-app/www/js/controls.js'
with open(ctrl_path, 'r', encoding='utf-8') as f:
    ctrl_code = f.read()

ctrl_code = ctrl_code.replace('var KEY = window.KEY || "imran2024";', 'var KEY = window.KEY || localStorage.getItem("panic_key") || "";')
ctrl_code = ctrl_code.replace('"imran2024"', '""')

with open(ctrl_path, 'w', encoding='utf-8') as f:
    f.write(ctrl_code)
print("controls.js updated!")

# 3. Update app.js
app_path = 'android-app/www/js/app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

app_code = app_code.replace("|| 'imran2024'", "|| ''")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_code)
print("app.js updated!")

# 4. Update network.js
net_path = 'android-app/www/js/network.js'
with open(net_path, 'r', encoding='utf-8') as f:
    net_code = f.read()

net_code = net_code.replace("|| 'imran2024'", "|| ''")

# In checkPcConnection, handle authenticated vs unauthenticated
old_chk = """      if (data) {

        if (data.lan_ip) localStorage.setItem('panic_lan_ip', data.lan_ip);

        if (data.tailscale_ip) localStorage.setItem('panic_tailscale_ip', data.tailscale_ip);

        if (data.tailscale_dns) localStorage.setItem('panic_tailscale_dns', data.tailscale_dns);

        if (data.tailscale_https_url) localStorage.setItem('panic_tailscale_https', data.tailscale_https_url);

        if (data.local_https_url) localStorage.setItem('panic_local_https', data.local_https_url);

        if (data.local_https_url || data.https_url) localStorage.setItem('panic_https_url', data.local_https_url || data.https_url);

        if (data.key && data.key !== KEY) {

          // The PC handed out its per-install key: adopt it right away so the

          // very next request (and the native bridge) uses the new credential.

          KEY = data.key;

          window.KEY = data.key;

          localStorage.setItem('panic_key', data.key);

        } else if (data.key) {

          localStorage.setItem('panic_key', data.key);

        }

        updateQuickConnectButtons(data.lan_ip, data.tailscale_ip, data.local_https_url, data.tailscale_dns, data.tailscale_https_url);

      }"""

new_chk = """      if (data) {
        if (data.authenticated === false || data.requires_auth) {
          _isCurrentlyConnected = false;
          updateNetworkUi(false, ms, 'PAIRING REQUIRED');
          var modal = document.getElementById('cyberPairingModal');
          if (modal && (!modal.style.display || modal.style.display === 'none')) {
            openPairingModal();
          }
          return;
        }

        if (data.lan_ip) localStorage.setItem('panic_lan_ip', data.lan_ip);
        if (data.tailscale_ip) localStorage.setItem('panic_tailscale_ip', data.tailscale_ip);
        if (data.tailscale_dns) localStorage.setItem('panic_tailscale_dns', data.tailscale_dns);
        if (data.tailscale_https_url) localStorage.setItem('panic_tailscale_https', data.tailscale_https_url);
        if (data.local_https_url) localStorage.setItem('panic_local_https', data.local_https_url);
        if (data.local_https_url || data.https_url) localStorage.setItem('panic_https_url', data.local_https_url || data.https_url);
        updateQuickConnectButtons(data.lan_ip, data.tailscale_ip, data.local_https_url, data.tailscale_dns, data.tailscale_https_url);
      }"""

assert old_chk in net_code, "old_chk not found in network.js"
net_code = net_code.replace(old_chk, new_chk)

with open(net_path, 'w', encoding='utf-8') as f:
    f.write(net_code)
print("network.js updated!")
