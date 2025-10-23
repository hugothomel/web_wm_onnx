#!/bin/bash
# Script to update init_state.json from the diamond training repo
# This needs to be run from the dedicated webapp repo

set -e

DIAMOND_REPO="/home/karajan/labzone/diamond"
WEBAPP_REPO="/home/karajan/labzone/web_wm_onnx"

echo "Regenerating init_state.json from training data..."
cd "$DIAMOND_REPO"
python scripts/export_init_state.py

echo "Copying init_state.json to webapp repo..."
cp "$DIAMOND_REPO/web_wm_onnx/public/init/init_state.json" "$WEBAPP_REPO/public/init/init_state.json"

echo "✓ Done! Init state updated with real training data."

# Show statistics
python3 << 'EOF'
import json
data = json.load(open('/home/karajan/labzone/web_wm_onnx/public/init/init_state.json'))
obs = data['obs_buffer']
nonzero = sum(1 for x in obs if x != 0.0)
print(f'\nStatistics:')
print(f'  Non-zero values: {nonzero}/{len(obs)} ({100*nonzero/len(obs):.1f}%)')
print(f'  Range: [{min(obs):.3f}, {max(obs):.3f}]')
print(f'  Action buffer: {data["act_buffer"]}')
EOF
