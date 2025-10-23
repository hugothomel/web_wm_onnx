import * as ort from 'onnxruntime-web'

export async function createSession(path: string): Promise<ort.InferenceSession> {
  const opts: ort.InferenceSession.SessionOptions = {
    executionProviders: navigator.gpu ? ['webgpu', 'wasm'] : ['wasm'],
    graphOptimizationLevel: 'all'
  }
  return ort.InferenceSession.create(path, opts)
}


