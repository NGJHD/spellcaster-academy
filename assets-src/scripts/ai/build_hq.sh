#!/bin/sh
# High-quality rebuild of existing concepts on the RTX 5060 Ti (owner, 2026-10-20): TRELLIS.2 shape with the
# 1024 cascade, a denser prep mesh (400k), colour, and the Blender build (set normal_map=True in its config).
#   sh assets-src/scripts/ai/build_hq.sh <name> [<name> ...]
# Check nvidia-smi first: the owner's llama-server sometimes holds this GPU.
cd "$(dirname "$0")"
export CUDA_DEVICE_ORDER=PCI_BUS_ID
TRELLIS_DIR="C:/ai/ComfyUI-3D"
wait_up() { for _ in $(seq 1 240); do [ "$(curl -s -m 3 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$1/system_stats")" = "200" ] && return 0; sleep 5; done; return 1; }
stop_port() { pid=$(netstat -ano | tr -d '\r' | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" {print $5; exit}'); [ -n "$pid" ] && taskkill //PID "$pid" //T //F > /dev/null 2>&1; sleep 5; }
for n in "$@"; do
  echo "== $n shape (1024 cascade) $(date)"
  (cd "$TRELLIS_DIR/ComfyUI" && ../venv/Scripts/python.exe main.py --cuda-device 0 --port 8189 > "$TMP/trellis_shape_gpu0.log" 2>&1 &)
  wait_up 8189 && python -u comfy.py mesh "$n" 2>&1 | tail -2
  stop_port 8189
  echo "== $n colour+build $(date)"
  (cd "$TRELLIS_DIR/ComfyUI" && ../venv/Scripts/python.exe main.py --cuda-device 0 --port 8190 > "$TMP/trellis_tex_gpu0.log" 2>&1 &)
  wait_up 8190 && python -u pipeline.py "$n" --tris=400000 2>&1 | cut -c1-200
  stop_port 8190
done
echo "ALL DONE $(date)"
