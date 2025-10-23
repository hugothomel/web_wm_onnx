import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import * as ort from 'onnxruntime-web'

// Configure ORT WASM asset location and performance flags
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/'
ort.env.wasm.simd = true
ort.env.wasm.numThreads = Math.max(1, Math.min(4, (navigator as any).hardwareConcurrency || 2))

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<App />)


