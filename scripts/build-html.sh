#!/bin/bash
# ダブルクリックで開ける静的HTML版を ../html版/ に書き出す
set -e
cd "$(dirname "$0")/.."
rm -rf out
STATIC_HTML=1 npx next build
D="../html版"
rm -rf "$D"
cp -R out "$D"
rm -rf out
cd "$D"
# 絶対パス(/_next/, /scenes/, /icon.svg)を相対パスに書き換え（file:// で読めるように）
find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.txt" \) -print0 \
  | xargs -0 perl -pi -e 's#(["'"'"'(\x60])/_next/#$1./_next/#g; s#(["'"'"'(])/scenes/#$1./scenes/#g; s#(["'"'"'(])/icon\.svg#$1./icon.svg#g; s#indexOf\("\./_next/"\)#indexOf("/_next/")#g'
echo "できました: $(pwd)/index.html"
