# Flappy Bird World Model WebApp (ONNX, WebGPU/WASM)

## Setup

```bash
cd web_wm_onnx
npm install
```

Copy your exported models:

```bash
mkdir -p public/models
cp /home/karajan/labzone/diamond/outputs/2025-10-20/14-37-30/onnx/*.onnx public/models/
```

## Run

```bash
npm run dev
```

Open the printed local URL. Controls: Space=Flap, r/Enter=Reset, .=Pause, e=Step, u=Upsampler ON/OFF

## Notes
- Uses onnxruntime-web with WebGPU when available, otherwise WASM fallback
- Diffusion sampler is a TS port of the Python logic
- Replace zero-init with a compact `init/init_state.json` for best quality (optional)

