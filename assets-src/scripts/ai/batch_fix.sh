#!/bin/sh
# 2026-10-07 playtest props: start the servers, make concepts, then shape (8189) and build (8190).
# Waits on server answers and log lines only (never on process names: see healthcheck.sh notes).
cd "$(dirname "$0")"
SCR="$1"
export CUDA_DEVICE_ORDER=PCI_BUS_ID
(cd /c/ai/ComfyUI && USE_TF=0 venv/Scripts/python.exe main.py --cuda-device 0 --lowvram --port 8188 > "$SCR/comfy_flux.log" 2>&1 &)
(cd /c/ai/ComfyUI-3D/ComfyUI && ../venv/Scripts/python.exe main.py --cuda-device 0 --port 8189 > "$SCR/comfy_3d.log" 2>&1 &)
(cd /c/ai/ComfyUI-3D/ComfyUI && ../venv/Scripts/python.exe main.py --cuda-device 1 --port 8190 > "$SCR/comfy_3d_b.log" 2>&1 &)
for port in 8188 8189 8190; do until curl -s -m 2 http://127.0.0.1:$port/system_stats > /dev/null; do sleep 5; done; echo "server $port up"; done
python concepts_fix.py 2>&1 | tail -5
for n in giant_tortoise paper_ship beacon_brazier dorm_bed wardrobe; do
  echo "== $n shape"
  python comfy.py mesh $n 2>&1 | tail -1 | cut -c1-200
  python -u pipeline.py $n --tris=200000 2>&1 | cut -c1-200
done
echo "BATCH DONE"
