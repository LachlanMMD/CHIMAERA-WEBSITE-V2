#!/usr/bin/env bash
# Cut a short, silent, phone-sized clip for the archive, plus its still.
#
#   scripts/clip.sh <video> <start> <seconds> <event-slug> <name>
#   scripts/clip.sh ~/Movies/IMG_4012.MOV 00:01:12 6 we-are-art-2026-04 07
#
# → src/assets/events/we-are-art-2026-04/07.mp4         (no sound, 720px wide, ~1–2 MB)
#   src/assets/events/we-are-art-2026-04/07.poster.jpg  (first frame, shown before it plays)
#
# The name decides where the clip sits in the strip (07 = after 06.jpg).
# Needs ffmpeg: `brew install ffmpeg` once.
set -euo pipefail

if [ "$#" -ne 5 ]; then
  sed -n '2,12p' "$0"
  exit 1
fi

input="$1"; start="$2"; seconds="$3"; slug="$4"; name="$5"
dir="src/assets/events/$slug"
mkdir -p "$dir"

ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$seconds" -i "$input" \
  -an -vf "scale=720:-2" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart \
  "$dir/$name.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$dir/$name.mp4" -frames:v 1 -q:v 3 "$dir/$name.poster.jpg"

echo "→ $dir/$name.mp4 ($(du -h "$dir/$name.mp4" | cut -f1)) + $name.poster.jpg"
