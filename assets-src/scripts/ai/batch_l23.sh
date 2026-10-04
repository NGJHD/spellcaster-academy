#!/bin/sh
# Level 2/3 mobs: shape (port 8189), then clean + colour + build (pipeline.py, port 8190).
cd "$(dirname "$0")"
for n in blotling smudgehound hollow_knight eraser_moth scribble_imp grey_herald vellum_wyrm redactor correction_moth foreman perfect_warden unwriter; do
  echo "== $n shape"
  python comfy.py mesh $n 2>&1 | tail -1 | cut -c1-200
  python -u pipeline.py $n 2>&1 | cut -c1-200
done
