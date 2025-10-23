# Initialization Scripts

## update_init_state.sh

This script regenerates the `public/init/init_state.json` file from real training data.

### Why this is needed

The world model needs to be initialized with actual game observations that include pipes, otherwise the generated gameplay will never show pipes. Previously, the init state was all zeros, which gave the model no context about what a proper game state looks like.

### How to use

```bash
# From anywhere:
./scripts/update_init_state.sh

# Or directly:
bash /home/karajan/labzone/web_wm_onnx/scripts/update_init_state.sh
```

### What it does

1. Runs the export script in the diamond training repo (`/home/karajan/labzone/diamond`)
2. Loads a random episode from the training dataset
3. Extracts 4 consecutive frames (T=4) from a good episode
4. Saves these observations to `init_state.json`
5. Copies the file to this webapp repo

### Requirements

- The diamond training repo must be at `/home/karajan/labzone/diamond`
- Training data must exist at `/home/karajan/labzone/diamond/data/flappybird_processed/train/`
- Python environment with torch, hydra-core, and the diamond codebase modules

### Without training data

If you don't have access to the training dataset, you can use the pre-generated `init_state.json` that's already in this repo. The file contains real game observations with pipes and is ready to use.
