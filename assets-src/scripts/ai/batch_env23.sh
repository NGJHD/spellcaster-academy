#!/bin/sh
# Level 2/3 environment set pieces: shape (port 8189), then clean + colour + build (port 8190).
cd "$(dirname "$0")"
for n in iron_throne dead_tree ash_rock festival_stall alchemy_furnace bronze_bell lighthouse black_galleon ink_cauldron forge_hammer boathouse copper_still rowing_boat journal_lectern citadel_tower; do
  echo "== $n shape"
  python comfy.py mesh $n 2>&1 | tail -1 | cut -c1-200
  python -u pipeline.py $n --tris=200000 2>&1 | cut -c1-200
done
