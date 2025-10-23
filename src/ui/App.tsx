import React, { useEffect, useRef, useState } from 'react'
import { createRunner } from '../wm/runner'

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<string>('Loading...')
  const [runner, setRunner] = useState<ReturnType<typeof createRunner> | null>(null)
  const [useUpsampler, setUseUpsampler] = useState<boolean>(true)
  const [paused, setPaused] = useState<boolean>(false)

  useEffect(() => {
    let stop = false
    ;(async () => {
      try {
        const r = await createRunner({
          canvas: canvasRef.current!,
          useUpsampler: true,
          onStatus: setStatus,
        })
        if (!stop) setRunner(r)
      } catch (e: any) {
        setStatus('Error: ' + String(e?.message ?? e))
      }
    })()
    return () => { stop = true; runner?.destroy() }
  }, [])

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (!runner) return
      if (ev.key === ' ') {
        ev.preventDefault()
        runner.inputFlap()
      } else if (ev.key === 'r' || ev.key === 'Enter') {
        runner.reset()
      } else if (ev.key === '.') {
        setPaused(p => !p)
      } else if (ev.key === 'e') {
        if (paused) runner.stepOnce()
      } else if (ev.key === 'u') {
        const v = !useUpsampler
        setUseUpsampler(v)
        runner.setUseUpsampler(v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [runner, paused, useUpsampler])

  useEffect(() => {
    if (!runner) return
    let raf = 0
    let last = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      if (!paused) runner.tick(dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [runner, paused])

  return (
    <div style={{ color: '#ddd', background: '#111', height: '100vh', margin: 0 }}>
      <div style={{ display: 'flex', gap: 16, padding: 8 }}>
        <div>Status: {status}</div>
        <div>Upsampler: {useUpsampler ? 'ON' : 'OFF'} (press 'u')</div>
        <div>Pause: {paused ? 'ON' : 'OFF'} (press '.')</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <canvas ref={canvasRef} width={640} height={640} style={{ imageRendering: 'pixelated', border: '1px solid #333' }} />
      </div>
      <div style={{ padding: 8, fontFamily: 'monospace', fontSize: 14 }}>
        Controls: Space=Flap, r/Enter=Reset, .=Pause, e=Step, u=Upsampler ON/OFF
      </div>
    </div>
  )
}


