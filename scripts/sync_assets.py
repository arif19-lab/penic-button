import sys, io, os, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

src_dir = 'android-app/www'
dst_dir = 'android-app/android/app/src/main/assets/public'

# 1. Sync full directory tree to Android APK public assets
if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)
shutil.copytree(src_dir, dst_dir)

# 2. Read modular index.html
with open('android-app/www/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 3. Create standalone inlined HTML bundle for single-binary C++ WebAssets.h fallback
css_path = 'android-app/www/css/style.css'
css_content = ''
if os.path.exists(css_path):
    with open(css_path, 'r', encoding='utf-8') as f:
        css_content = f.read()

js_bundle = ''
for jf in ['logger.js', 'network.js', 'gemini_prompt.js', 'controls.js', 'streamer.js', 'personas.js', 'gemini_live.js', 'app.js']:
    jp = os.path.join('android-app/www/js', jf)
    if os.path.exists(jp):
        with open(jp, 'r', encoding='utf-8') as f:
            js_bundle += f"\n// --- {jf} ---\n" + f.read() + "\n"

jsqr_path = 'android-app/www/jsqr.min.js'
jsqr_content = ''
if os.path.exists(jsqr_path):
    with open(jsqr_path, 'r', encoding='utf-8') as f:
        jsqr_content = f.read()

import re

# Read listening.gif bytes for embedded C++ fallback
listening_gif_path = 'android-app/www/assets/listening.gif'
listening_gif_bytes = b''
if os.path.exists(listening_gif_path):
    with open(listening_gif_path, 'rb') as f:
        listening_gif_bytes = f.read()

gif_byte_array = ', '.join(f'0x{b:02x}' for b in listening_gif_bytes)

# Inlined fallback HTML for C++ single binary
inlined_html = re.sub(r'<link\s+rel=["\']stylesheet["\']\s+href=["\']css/style\.css(?:\?[^"\']*)?["\']\s*>', f'<style>\n{css_content}\n</style>', html)
inlined_html = re.sub(r'<script\s+src=["\'](?:js/)?jsqr\.min\.js(?:\?[^"\']*)?["\']\s*></script>', f'<script>\n{jsqr_content}\n</script>', inlined_html)
for sname in ['logger', 'network', 'gemini_prompt', 'controls', 'streamer', 'personas', 'gemini_live']:
    inlined_html = re.sub(rf'<script\s+src=["\']js/{sname}\.js(?:\?[^"\']*)?["\']\s*></script>', '', inlined_html)
inlined_html = re.sub(r'<script\s+src=["\']js/app\.js(?:\?[^"\']*)?["\']\s*></script>', lambda m: f'<script>\n{js_bundle}\n</script>', inlined_html)

web_assets = f'''#pragma once
#include <string>

// Full embedded cyber dashboard HTML/JS/CSS (Self-Contained Fallback)
static const char* DASHBOARD_HTML = R"HTML(
{inlined_html}
)HTML";

namespace WebAssets {{
    static const unsigned char LISTENING_GIF_BYTES[] = {{
        {gif_byte_array}
    }};

    inline std::string GetListeningGif() {{
        return std::string((const char*)LISTENING_GIF_BYTES, sizeof(LISTENING_GIF_BYTES));
    }}
}}
'''

with open('src/ui/WebAssets.h', 'w', encoding='utf-8') as f:
    f.write(web_assets)

# 4. Sync assets & www to ProgramData
prog_data_base = os.path.join(os.environ.get('ProgramData', 'C:\\ProgramData'), 'PanicButton')
if os.path.exists(prog_data_base):
    src_assets = 'android-app/www/assets'
    if os.path.exists(src_assets):
        for sub in ['assets', os.path.join('www', 'assets')]:
            dst_a = os.path.join(prog_data_base, sub)
            if os.path.exists(dst_a):
                shutil.rmtree(dst_a)
            shutil.copytree(src_assets, dst_a)
        print(f'Synchronized assets to {prog_data_base}')

# 4. Sync gemini-proxy to C:\ProgramData\PanicButton\gemini-proxy
prog_data_proxy = os.path.join(os.environ.get('ProgramData', 'C:\\ProgramData'), 'PanicButton', 'gemini-proxy')
if os.path.exists(prog_data_proxy):
    # Sync single files
    for fname in ['server.js', 'package.json', 'mcp_servers.json']:
        src_f = os.path.join('gemini-proxy', fname)
        dst_f = os.path.join(prog_data_proxy, fname)
        if os.path.exists(src_f):
            shutil.copy2(src_f, dst_f)

    # Sync directories (tools, workers, mcp, core)
    for dname in ['tools', 'workers', 'mcp', 'core']:
        src_d = os.path.join('gemini-proxy', dname)
        dst_d = os.path.join(prog_data_proxy, dname)
        if os.path.exists(src_d):
            if os.path.exists(dst_d):
                shutil.rmtree(dst_d)
            shutil.copytree(src_d, dst_d)

    # Sync @modelcontextprotocol node_modules if present
    src_mcp_nm = os.path.join('gemini-proxy', 'node_modules', '@modelcontextprotocol')
    dst_mcp_nm = os.path.join(prog_data_proxy, 'node_modules', '@modelcontextprotocol')
    if os.path.exists(src_mcp_nm):
        if os.path.exists(dst_mcp_nm):
            shutil.rmtree(dst_mcp_nm)
        shutil.copytree(src_mcp_nm, dst_mcp_nm)

    print(f'Synchronized gemini-proxy (tools, workers, mcp, sdk) to {prog_data_proxy}')

print('All modular assets and WebAssets.h synchronized successfully!')
