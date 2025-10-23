import * as ort from 'onnxruntime-web'

export class DiffusionSampler {
  private numSteps = 3
  private sigmaMin = 2e-3
  private sigmaMax = 5.0
  private rho = 7
  private order = 1
  private sChurn = 0
  private sTmin = 0
  private sTmax = Infinity
  private sNoise = 1

  private buildSigmas(): Float32Array {
    const num = this.numSteps
    const minInv = Math.pow(this.sigmaMin, 1 / this.rho)
    const maxInv = Math.pow(this.sigmaMax, 1 / this.rho)
    const l = new Float32Array(num)
    for (let i = 0; i < num; i++) l[i] = i / (num - 1)
    const sigmas = new Float32Array(num + 1)
    for (let i = 0; i < num; i++) sigmas[i] = Math.pow(maxInv + l[i] * (minInv - maxInv), this.rho)
    sigmas[num] = 0
    return sigmas
  }

  async sample(
    denoiser: ort.InferenceSession,
    prevObsTC: Float32Array, // [T*C*H*W]
    prevActT: Int32Array, // [T]
    C: number, H: number, W: number, T: number
  ): Promise<Float32Array> {
    const device = 'cpu'
    const sigmas = this.buildSigmas()
    // Start from previous frame plus small noise, not pure noise
    const last = prevObsTC.subarray((T - 1) * C * H * W, T * C * H * W)
    let x = new Float32Array(last.length)
    for (let i = 0; i < x.length; i++) x[i] = last[i] + (Math.random() * 2 - 1) * 0.05
    const gamma_ = Math.min(this.sChurn / (sigmas.length - 1), Math.SQRT2 - 1)
    const s_in = 1.0

    for (let i = 0; i < sigmas.length - 1; i++) {
      const sigma = sigmas[i]
      const nextSigma = sigmas[i + 1]
      const gamma = (sigma >= this.sTmin && sigma <= this.sTmax) ? gamma_ : 0
      const sigmaHat = sigma * (gamma + 1)
      if (gamma > 0) {
        const eps = new Float32Array(x.length)
        for (let j = 0; j < eps.length; j++) eps[j] = (Math.random() * 2 - 1) * this.sNoise
        for (let j = 0; j < x.length; j++) x[j] = x[j] + eps[j] * Math.sqrt(sigmaHat * sigmaHat - sigma * sigma)
      }
      const den = await this.denoise(denoiser, x, sigma, prevObsTC, prevActT, C, H, W, T)
      const d = new Float32Array(x.length)
      for (let j = 0; j < x.length; j++) d[j] = (x[j] - den[j]) / sigmaHat
      const dt = nextSigma - sigmaHat
      if (this.order === 1 || nextSigma === 0) {
        for (let j = 0; j < x.length; j++) x[j] = x[j] + d[j] * dt
      } else {
        const x2 = new Float32Array(x.length)
        for (let j = 0; j < x.length; j++) x2[j] = x[j] + d[j] * dt
        const den2 = await this.denoise(denoiser, x2, nextSigma * s_in, prevObsTC, prevActT, C, H, W, T)
        const d2 = new Float32Array(x.length)
        for (let j = 0; j < x.length; j++) d2[j] = (x2[j] - den2[j]) / nextSigma
        for (let j = 0; j < x.length; j++) x[j] = x[j] + ((d[j] + d2[j]) / 2) * dt
      }
    }
    return x
  }

  private async denoise(
    denoiser: ort.InferenceSession,
    noisyNext: Float32Array,
    sigma: number,
    prevObsTC: Float32Array,
    prevActT: Int32Array,
    C: number, H: number, W: number, T: number
  ): Promise<Float32Array> {
    const feeds: Record<string, ort.Tensor> = {
      noisy_next_obs: new ort.Tensor('float32', noisyNext, [1, C, H, W]),
      sigma: new ort.Tensor('float32', new Float32Array([sigma]), [1]),
      prev_obs: new ort.Tensor('float32', prevObsTC, [1, T * C, H, W]),
      prev_act: new ort.Tensor('int64', BigInt64Array.from(Array.from(prevActT, v => BigInt(v))), [1, T])
    }
    const out = await denoiser.run(feeds)
    return (out['denoised'] as ort.Tensor).data as Float32Array
  }
}


