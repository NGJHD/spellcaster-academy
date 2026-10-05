#!/bin/sh
# Health check for long AI pipeline runs (owner: background jobs have silently stalled before).
# Reports, for each watched job: is its process alive, and when did anything last make progress
# (job log, ComfyUI server logs, output folders). Prints STALLED if work is running but nothing has
# changed for STALL_MIN minutes, DONE when no job process is left.
#
#   sh assets-src/scripts/ai/healthcheck.sh <scratch-dir>
SCRATCH="${1:?scratch dir}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
STALL_MIN=45
now=$(date +%s)

age() { # minutes since a path last changed (newest file inside a folder)
  if [ -d "$1" ]; then t=$(find "$1" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
  elif [ -f "$1" ]; then t=$(stat -c %Y "$1"); else echo 9999; return; fi
  [ -z "$t" ] && { echo 9999; return; }
  echo $(( (now - t) / 60 ))
}

jobs=$(powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { \$_.Name -match '^(python|blender|sh)\.exe$' -and \$_.CommandLine -match 'pipeline\.py|comfy\.py (mesh|texture)|batch_env23|batch_l23|build_ai_creature|prep_raw' } | ForEach-Object { \$_.CommandLine }" 2>/dev/null | tr -d '\r' | grep -v '^$' | sed 's/.*\(pipeline\.py[^"]*\|comfy\.py [a-z]* [a-z_]*\|batch_[a-z0-9]*\.sh\|build_ai_creature\.py[^"]*\|prep_raw\.py[^"]*\).*/\1/' | sort | uniq -c)

newest=9999
for p in "$SCRATCH/batch_env.log" "$SCRATCH/comfy_3d.log" "$SCRATCH/comfy_3d_b.log" "$ROOT/assets-src/ai-meshes" "$ROOT/public/assets/creatures" "$ROOT/public/assets/props"; do
  a=$(age "$p"); [ "$a" -lt "$newest" ] && newest=$a
done

s1=$(curl -s -m 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:8189/system_stats)
s2=$(curl -s -m 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:8190/system_stats)
gpu=$(nvidia-smi --query-gpu=index,utilization.gpu,memory.used --format=csv,noheader 2>/dev/null | tr '\n' ';')

echo "time: $(date '+%H:%M')  last progress: ${newest} min ago"
echo "servers: shape 8189=$s1 (000 is normal while busy)  texture 8190=$s2"
echo "gpus: $gpu"
echo "jobs:"; [ -n "$jobs" ] && echo "$jobs" || echo "  (none)"
echo "recent builds:"; grep -h -E "BUILT|Traceback|RuntimeError" "$SCRATCH"/batch_env.log "$SCRATCH"/../tasks/*.output 2>/dev/null | cut -c1-90 | tail -4

if [ -z "$jobs" ]; then echo "STATUS: DONE (no pipeline process running)"
elif [ "$newest" -ge "$STALL_MIN" ]; then echo "STATUS: STALLED (jobs running, nothing changed for ${newest} min)"
else echo "STATUS: ALIVE"; fi
