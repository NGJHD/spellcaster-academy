#!/bin/sh
# Second pass for the 2026-10-07 props: waits for batch_fix.sh to finish (on its log line, never on
# process names), then adds the deer and rebuilds the tortoise at a higher detail budget.
cd "$(dirname "$0")"
SCR="$1"
until grep -q "BATCH DONE" "$SCR/batch_env.log" 2>/dev/null; do sleep 30; done
python concepts_fix.py erased_deer 2>&1 | tail -1
python comfy.py mesh erased_deer 2>&1 | tail -1 | cut -c1-200
python -u pipeline.py erased_deer --tris=300000 2>&1 | cut -c1-200
python -u pipeline.py giant_tortoise --tris=300000 2>&1 | cut -c1-200
echo "BATCH2 DONE"
