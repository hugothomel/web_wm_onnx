import { WorldModelEnv } from './worldModelEnv'
import { Upsampler } from './upsampler'
import { quantizeToImageData } from '../wm/util'

type RunnerOptions = {
  canvas: HTMLCanvasElement
  useUpsampler: boolean
  onStatus?: (s: string) => void
}

export async function createRunner(opts: RunnerOptions) {
  const ctx = opts.canvas.getContext('2d')!
  let useUpsampler = opts.useUpsampler
  let destroyed = false
  let env: WorldModelEnv | null = null
  let up: Upsampler | null = null

  opts.onStatus?.('Loading models...')
  env = await WorldModelEnv.create()
  up = await Upsampler.create()
  opts.onStatus?.('Ready')

  function draw(buf: Float32Array, c: number, h: number, w: number) {
    const id = ctx.createImageData(opts.canvas.width, opts.canvas.height)
    quantizeToImageData(buf, c, h, w, id)
    ctx.putImageData(id, 0, 0)
  }

  return {
    async tick(_dtMs: number) {
      if (!env) return
      const { obs, c, h, w } = env.currentObs()
      let toDraw = obs
      if (useUpsampler && up) {
        const hi = await up.upsampleAsync(obs, c, h, w)
        toDraw = hi
        // after upsample, dims are doubled
        draw(toDraw, c, h * 2, w * 2)
      } else {
        draw(toDraw, c, h, w)
      }
      await env.step()
    },
    inputFlap() {
      env?.inputFlap()
    },
    reset() {
      env?.reset()
    },
    stepOnce() {
      env?.step()
    },
    setUseUpsampler(v: boolean) {
      useUpsampler = v
    },
    async destroy() {
      destroyed = true
      await env?.destroy()
    }
  }
}


