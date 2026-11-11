import os, re, glob

www_dir = 'android-app/www'
frontend_files = []
for root, dirs, files in os.walk(www_dir):
    for f in files:
        if f.endswith(('.html', '.js', '.css')):
            frontend_files.append(os.path.join(root, f))

endpoint_pattern = re.compile(r'[\'"`](/(?:api|gemini-proxy|download|ws|stream|status|tailscale|lock|unlock|sleep|restart|shutdown|assets|qr|setup|jsqr)[^\'"\s]*)[\'"`]')

discovered_endpoints = set()
for fpath in frontend_files:
    try:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for match in endpoint_pattern.findall(content):
                clean = match.split('?')[0].split('#')[0]
                discovered_endpoints.add((clean, os.path.basename(fpath)))
    except Exception as e:
        pass

print("Discovered Frontend Endpoints:")
for ep, src in sorted(discovered_endpoints):
    print(f"  {ep:<35} (from {src})")

# Now check HttpRouter.cpp for handled routes
with open('src/server/HttpRouter.cpp', 'r', encoding='utf-8', errors='ignore') as f:
    http_cpp = f.read()

router_routes = re.findall(r'request\.find\(\s*"(GET|POST|HEAD)\s+([^"\s]+)', http_cpp)
print("\nHttpRouter.cpp Routes:")
for method, r in sorted(set(router_routes)):
    print(f"  {method:<5} {r}")

# Check Gemini Proxy routes
if os.path.exists('gemini-proxy/server.js'):
    with open('gemini-proxy/server.js', 'r', encoding='utf-8', errors='ignore') as f:
        node_srv = f.read()
    node_routes = re.findall(r'app\.(get|post|use)\(\s*[\'"]([^\'"]+)', node_srv)
    print("\nGemini Proxy server.js Routes:")
    for method, r in sorted(set(node_routes)):
        print(f"  {method.upper():<5} {r}")
