import * as ort from 'onnxruntime-web'
import { DiffusionSampler } from '../wm_sampler/diffusionSampler'

type ObsState = { obs: Float32Array, c: number, h: number, w: number }

export class WorldModelEnv {
  private sampler: DiffusionSampler
  private rewEnd: ort.InferenceSession
  private denoiser: ort.InferenceSession
  private obsBuf: Float32Array
  private actBuf: Int32Array
  private hx: Float32Array
  private cx: Float32Array
  private C = 3
  private H = 64
  private W = 64
  private T = 4

  static async create(): Promise<WorldModelEnv> {
    const hasWebGPU = typeof (navigator as any).gpu !== 'undefined'
    const sessOpt: ort.InferenceSession.SessionOptions = {
      executionProviders: hasWebGPU ? ['webgpu', 'wasm'] : ['wasm'],
      graphOptimizationLevel: 'all'
    }
    // Fetch relative to site root; ensure models exist under public/models/
    const denoiser = await ort.InferenceSession.create('/models/denoiser.onnx', sessOpt)
    const rewEnd = await ort.InferenceSession.create('/models/rew_end.onnx', sessOpt)
    const sampler = new DiffusionSampler()
    const env = new WorldModelEnv(sampler, denoiser, rewEnd)
    await env.reset()
    return env
  }

  private constructor(sampler: DiffusionSampler, denoiser: ort.InferenceSession, rewEnd: ort.InferenceSession) {
    this.sampler = sampler
    this.denoiser = denoiser
    this.rewEnd = rewEnd
    this.obsBuf = new Float32Array(this.T * this.C * this.H * this.W)
    this.actBuf = new Int32Array(this.T)
    this.hx = new Float32Array(1 * 1 * 512)
    this.cx = new Float32Array(1 * 1 * 512)
  }

  async reset() {
    // Try to fetch an initialization state exported from Python for good context
    try {
      const res = await fetch('/init/init_state.json')
      if (res.ok) {
        const j = await res.json()
        const T = (j.T ?? this.T) | 0
        const C = (j.C ?? this.C) | 0
        const H = (j.H ?? this.H) | 0
        const W = (j.W ?? this.W) | 0
        if (T === this.T && C === this.C && H === this.H && W === this.W) {
          const ob = new Float32Array(j.obs_buffer)
          const ab = new Int32Array(j.act_buffer)
          const hx = new Float32Array(j.hx)
          const cx = new Float32Array(j.cx)
          if (ob.length === this.obsBuf.length) this.obsBuf.set(ob)
          if (ab.length === this.actBuf.length) this.actBuf.set(ab)
          if (hx.length === this.hx.length) this.hx.set(hx)
          if (cx.length === this.cx.length) this.cx.set(cx)
        } else {
          // Fallback to zero init if sizes mismatch
          this.obsBuf.fill(0)
          this.actBuf.fill(0)
          this.hx.fill(0)
          this.cx.fill(0)
        }
        return
      }
    } catch (_) {
      // ignore, fallback to zero init
    }
    this.obsBuf.fill(0)
    this.actBuf.fill(0)
    this.hx.fill(0)
    this.cx.fill(0)
  }

  currentObs(): ObsState {
    const offset = (this.T - 1) * this.C * this.H * this.W
    return { obs: this.obsBuf.subarray(offset, offset + this.C * this.H * this.W), c: this.C, h: this.H, w: this.W }
  }

  inputFlap() {
    this.actBuf[this.T - 1] = 1
  }

  private rollBuffers(nextObs: Float32Array, action: number) {
    const frameSize = this.C * this.H * this.W
    // roll obs left by one frame
    this.obsBuf.copyWithin(0, frameSize)
    this.obsBuf.set(nextObs, (this.T - 1) * frameSize)
    // roll actions left
    this.actBuf.copyWithin(0, 1)
    this.actBuf[this.T - 1] = action
  }

  async step() {
    // Build prev_obs [1, T*C, H, W]
    const prevObs = new Float32Array(this.T * this.C * this.H * this.W)
    prevObs.set(this.obsBuf)
    const prevAct = new Int32Array(this.T)
    prevAct.set(this.actBuf)

    const next = await this.sampler.sample(this.denoiser, prevObs, prevAct, this.C, this.H, this.W, this.T)
    // rew/end prediction (optional for UI; used to know when dead)
    const obsBTCHW = new Float32Array(1 * 1 * this.C * this.H * this.W)
    const nextBTCHW = new Float32Array(1 * 1 * this.C * this.H * this.W)
    // Convert CHW planar into contiguous [C,H,W] planar order; current buffers are already planar CHW
    obsBTCHW.set(this.obsBuf.subarray((this.T - 1) * (this.C * this.H * this.W)))
    nextBTCHW.set(next)

    const feeds: Record<string, ort.Tensor> = {
      obs: new ort.Tensor('float32', obsBTCHW, [1, 1, this.C, this.H, this.W]),
      act: new ort.Tensor('int64', BigInt64Array.from([0n]), [1, 1]),
      next_obs: new ort.Tensor('float32', nextBTCHW, [1, 1, this.C, this.H, this.W]),
      hx: new ort.Tensor('float32', this.hx, [1, 1, 512]),
      cx: new ort.Tensor('float32', this.cx, [1, 1, 512])
    }
    const out = await this.rewEnd.run(feeds)
    // logits are not displayed, but we keep states updated
    const hxOut = out['hx_out'] as ort.Tensor
    const cxOut = out['cx_out'] as ort.Tensor
    this.hx.set(hxOut.data as Float32Array)
    this.cx.set(cxOut.data as Float32Array)

    // roll buffers
    this.rollBuffers(next, 0)
  }

  async destroy() {}
}


