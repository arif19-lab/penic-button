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
for jf in ['network.js', 'gemini_prompt.js', 'controls.js', 'streamer.js', 'gemini_live.js', 'app.js']:
    jp = os.path.join('android-app/www/js', jf)
    if os.path.exists(jp):
        with open(jp, 'r', encoding='utf-8') as f:
            js_bundle += f"\n// --- {jf} ---\n" + f.read() + "\n"

# Inlined fallback HTML for C++ single binary
inlined_html = html.replace('<link rel="stylesheet" href="css/style.css">', f'<style>\n{css_content}\n</style>')
inlined_html = inlined_html.replace('<script src="js/network.js"></script>', '')
inlined_html = inlined_html.replace('<script src="js/gemini_prompt.js"></script>', '')
inlined_html = inlined_html.replace('<script src="js/controls.js"></script>', '')
inlined_html = inlined_html.replace('<script src="js/streamer.js"></script>', '')
inlined_html = inlined_html.replace('<script src="js/gemini_live.js"></script>', '')
inlined_html = inlined_html.replace('<script src="js/app.js"></script>', f'<script>\n{js_bundle}\n</script>')

web_assets = f'''#pragma once
#include <string>

// Full embedded cyber dashboard HTML/JS/CSS (Self-Contained Fallback)
static const char* DASHBOARD_HTML = R"HTML(
{inlined_html}
)HTML";
'''

with open('src/ui/WebAssets.h', 'w', encoding='utf-8') as f:
    f.write(web_assets)

print('All modular assets and WebAssets.h synchronized successfully!')
