#!/bin/sh
# Third pass (Chrome playtest 2026-10-07): the Ward Warden as a proper AI model. Waits for batch 2.
cd "$(dirname "$0")"
SCR="$1"
until grep -q "BATCH2 DONE" "$SCR/batch2.log" 2>/dev/null; do sleep 30; done
python concepts_fix.py ward_warden_ai 2>&1 | tail -1
python comfy.py mesh ward_warden_ai 2>&1 | tail -1 | cut -c1-200
python -u pipeline.py ward_warden_ai --tris=300000 2>&1 | cut -c1-200
echo "BATCH3 DONE"
