#!/bin/sh
# Level 2 skyline buildings (2026-10-07 audit): a gothic academy hall and a round tower.
cd "$(dirname "$0")"
SCR="$1"
export CUDA_DEVICE_ORDER=PCI_BUS_ID
for port in 8188 8189 8190; do curl -s -m 2 http://127.0.0.1:$port/system_stats > /dev/null || echo "server $port down"; done
(curl -s -m 2 http://127.0.0.1:8188/system_stats > /dev/null) || (cd /c/ai/ComfyUI && USE_TF=0 venv/Scripts/python.exe main.py --cuda-device 0 --lowvram --port 8188 > "$SCR/comfy_flux.log" 2>&1 &)
(curl -s -m 2 http://127.0.0.1:8189/system_stats > /dev/null) || (cd /c/ai/ComfyUI-3D/ComfyUI && ../venv/Scripts/python.exe main.py --cuda-device 0 --port 8189 > "$SCR/comfy_3d.log" 2>&1 &)
(curl -s -m 2 http://127.0.0.1:8190/system_stats > /dev/null) || (cd /c/ai/ComfyUI-3D/ComfyUI && ../venv/Scripts/python.exe main.py --cuda-device 1 --port 8190 > "$SCR/comfy_3d_b.log" 2>&1 &)
for port in 8188 8189 8190; do until curl -s -m 2 http://127.0.0.1:$port/system_stats > /dev/null; do sleep 5; done; echo "server $port up"; done
python concepts_fix.py academy_hall academy_tower 2>&1 | tail -2
for n in academy_hall academy_tower; do
  echo "== $n"
  python comfy.py mesh $n 2>&1 | tail -1 | cut -c1-200
  python -u pipeline.py $n --tris=300000 2>&1 | cut -c1-200
done
echo "BATCH5 DONE"
