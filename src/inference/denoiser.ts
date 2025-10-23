import * as ort from 'onnxruntime-web'

export class Denoiser {
  private sess: ort.InferenceSession
  constructor(sess: ort.InferenceSession) { this.sess = sess }

  static async create(): Promise<Denoiser> {
    const hasWebGPU = typeof (navigator as any).gpu !== 'undefined'
    const sess = await ort.InferenceSession.create('/models/denoiser_fp16.onnx', {
      executionProviders: hasWebGPU ? ['webgpu', 'wasm'] : ['wasm'],
      graphOptimizationLevel: 'all'
    })
    return new Denoiser(sess)
  }

  async denoise(noisy: Float32Array, sigma: number, prevObsTC: Float32Array, prevActT: Int32Array, C: number, H: number, W: number, T: number): Promise<Float32Array> {
    const feeds: Record<string, ort.Tensor> = {
      noisy_next_obs: new ort.Tensor('float32', noisy, [1, C, H, W]),
      sigma: new ort.Tensor('float32', new Float32Array([sigma]), [1]),
      prev_obs: new ort.Tensor('float32', prevObsTC, [1, T * C, H, W]),
      prev_act: new ort.Tensor('int64', BigInt64Array.from(Array.from(prevActT, v => BigInt(v))), [1, T])
    }
    const out = await this.sess.run(feeds)
    return (out['denoised'] as ort.Tensor).data as Float32Array
  }
}


