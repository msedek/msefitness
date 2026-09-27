#!/usr/bin/env bash
# Uso: get-font.sh "<query css2 de Google Fonts, ej: Archivo:wdth,wght@62..125,100..900>" <slug>
# Descarga solo el subset latin (+latin-ext) a fonts/<slug>/ y genera fonts/<slug>.css con rutas relativas.
set -euo pipefail
cd "$(dirname "$0")"
Q="$1"; SLUG="$2"; mkdir -p "$SLUG"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
CSS=$(curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=${Q// /+}&display=swap")
python3 - "$SLUG" <<PY
import re,sys,urllib.request,os,hashlib
slug=sys.argv[1]; css='''$CSS'''
out=[]
for block in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face\s*{[^}]*})', css):
    subset,face=block
    if subset not in ('latin','latin-ext'): continue
    url=re.search(r'url\((https://[^)]+)\)',face).group(1)
    fn=f"{slug}/{hashlib.md5(url.encode()).hexdigest()[:10]}.woff2"
    if not os.path.exists(fn): urllib.request.urlretrieve(url,fn)
    out.append(face.replace(url,fn))
open(f"{slug}.css","w").write("\n".join(out)+"\n")
print(f"{slug}.css: {len(out)} faces")
PY
