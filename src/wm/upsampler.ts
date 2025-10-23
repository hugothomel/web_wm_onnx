import * as ort from 'onnxruntime-web'

export class Upsampler {
  private sess: ort.InferenceSession

  static async create(): Promise<Upsampler> {
    const sess = await ort.InferenceSession.create('/models/upsampler_fp16.onnx', {
      executionProviders: navigator.gpu ? ['webgpu', 'wasm'] : ['wasm'],
      graphOptimizationLevel: 'all'
    })
    return new Upsampler(sess)
  }

  private constructor(sess: ort.InferenceSession) {
    this.sess = sess
  }

  upsample(lowres: Float32Array, c: number, h: number, w: number): Float32Array {
    const feeds: Record<string, ort.Tensor> = {
      lowres: new ort.Tensor('float32', lowres, [1, c, h, w])
    }
    // synchronous wrapper via Atomics is not available; using async-to-sync is complex.
    // For our single-step redraw path, we leverage a cached promise in the runner if needed.
    // Here, expose a blocking call by throwing; in practice, runner should await an async version.
    throw new Error('Use async upsampleAsync in UI loop')
  }

  async upsampleAsync(lowres: Float32Array, c: number, h: number, w: number): Promise<Float32Array> {
    const feeds: Record<string, ort.Tensor> = {
      lowres: new ort.Tensor('float32', lowres, [1, c, h, w])
    }
    const out = await this.sess.run(feeds)
    return (out['highres'] as ort.Tensor).data as Float32Array
  }
}


