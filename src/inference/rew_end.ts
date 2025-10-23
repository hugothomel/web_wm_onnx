import * as ort from 'onnxruntime-web'

export class RewEnd {
  private sess: ort.InferenceSession
  constructor(sess: ort.InferenceSession) { this.sess = sess }

  static async create(): Promise<RewEnd> {
    const hasWebGPU = typeof (navigator as any).gpu !== 'undefined'
    const sess = await ort.InferenceSession.create('/models/rew_end_fp16.onnx', {
      executionProviders: hasWebGPU ? ['webgpu', 'wasm'] : ['wasm'],
      graphOptimizationLevel: 'all'
    })
    return new RewEnd(sess)
  }

  async run(obs: Float32Array, act: Int32Array, nextObs: Float32Array, hx: Float32Array, cx: Float32Array, C: number, H: number, W: number): Promise<{hx: Float32Array, cx: Float32Array}> {
    const feeds: Record<string, ort.Tensor> = {
      obs: new ort.Tensor('float32', obs, [1, 1, C, H, W]),
      act: new ort.Tensor('int64', BigInt64Array.from([0n]), [1, 1]),
      next_obs: new ort.Tensor('float32', nextObs, [1, 1, C, H, W]),
      hx: new ort.Tensor('float32', hx, [1, 1, 512]),
      cx: new ort.Tensor('float32', cx, [1, 1, 512])
    }
    const out = await this.sess.run(feeds)
    const hxOut = (out['hx_out'] as ort.Tensor).data as Float32Array
    const cxOut = (out['cx_out'] as ort.Tensor).data as Float32Array
    return { hx: hxOut, cx: cxOut }
  }
}


