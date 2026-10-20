#!/bin/sh
# Builds AI props using only the RTX 3080 (owner, 2026-10-08: the 5060 Ti is busy). Starts each ComfyUI
# server on the 3080 in turn and stops it afterwards:
#   1. Flux 2 Klein concept (ComfyUI, port 8188)   2. TRELLIS.2 shape at 512, no 1024 cascade (port 8189)
#   3. prep_raw + TRELLIS.2 vertex colours (port 8190) + Blender build (pipeline.py)
#
#   sh assets-src/scripts/ai/build_on_3080.sh <name> [<name> ...]
# Creatures take their concepts from another script: CONCEPTS=concepts_level23.py sh build_on_3080.sh <name>
cd "$(dirname "$0")"
export CUDA_DEVICE_ORDER=PCI_BUS_ID
FLUX_DIR="C:/AI/ComfyUI"
TRELLIS_DIR="C:/ai/ComfyUI-3D"

wait_up() { # port
  for _ in $(seq 1 180); do
    [ "$(curl -s -m 3 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$1/system_stats")" = "200" ] && return 0
    sleep 5
  done
  echo "server on $1 did not start"; return 1
}
stop_port() { # port: kill whatever listens on it
  pid=$(netstat -ano | tr -d '\r' | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" {print $5; exit}')
  [ -n "$pid" ] && taskkill //PID "$pid" //T //F > /dev/null 2>&1
  sleep 5
}

for n in "$@"; do
  # Stop at a failed concept: the later stages would build the old concept image instead.
  before=$(stat -c %Y "../../concepts/$n.png" 2>/dev/null || echo 0)
  echo "== $n concept"
  (cd "$FLUX_DIR" && USE_TF=0 ./venv/Scripts/python.exe main.py --cuda-device 1 --lowvram --port 8188 > "$TMP/flux_3080.log" 2>&1 &)
  wait_up 8188 && python -u "${CONCEPTS:-concepts_env23.py}" "$n" 2>&1 | tail -2
  stop_port 8188
  if [ "$(stat -c %Y "../../concepts/$n.png" 2>/dev/null || echo 0)" = "$before" ]; then echo "== $n concept failed, skipping"; continue; fi

  echo "== $n shape"
  (cd "$TRELLIS_DIR/ComfyUI" && ../venv/Scripts/python.exe main.py --cuda-device 1 --port 8189 > "$TMP/trellis_shape_3080.log" 2>&1 &)
  wait_up 8189 && python -u comfy.py mesh "$n" --no-cascade 2>&1 | tail -2
  stop_port 8189

  echo "== $n clean, colour, build"
  (cd "$TRELLIS_DIR/ComfyUI" && ../venv/Scripts/python.exe main.py --cuda-device 1 --port 8190 > "$TMP/trellis_tex_3080.log" 2>&1 &)
  wait_up 8190 && python -u pipeline.py "$n" --tris=150000 2>&1 | cut -c1-200
  stop_port 8190
done
echo "ALL DONE"
