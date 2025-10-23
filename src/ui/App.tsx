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

  const handleFlap = () => {
    if (runner) {
      runner.inputFlap()
    }
  }

  const handleReset = () => {
    if (runner) {
      runner.reset()
    }
  }

  const handleTogglePause = () => {
    setPaused(p => !p)
  }

  const handleToggleUpsampler = () => {
    const v = !useUpsampler
    setUseUpsampler(v)
    if (runner) {
      runner.setUseUpsampler(v)
    }
  }

  return (
    <div style={{
      color: '#e0e0e0',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      minHeight: '100vh',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.3)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{
          margin: '0 0 12px 0',
          fontSize: '24px',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          Flappy Bird - World Model ONNX
        </h1>
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: '14px'
        }}>
          <div style={{
            padding: '6px 12px',
            background: 'rgba(79, 172, 254, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(79, 172, 254, 0.3)'
          }}>
            {status}
          </div>
          <div style={{
            padding: '6px 12px',
            background: useUpsampler ? 'rgba(0, 242, 254, 0.1)' : 'rgba(128, 128, 128, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${useUpsampler ? 'rgba(0, 242, 254, 0.3)' : 'rgba(128, 128, 128, 0.3)'}`
          }}>
            Upsampler: {useUpsampler ? 'ON' : 'OFF'}
          </div>
          <div style={{
            padding: '6px 12px',
            background: paused ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 242, 96, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${paused ? 'rgba(255, 107, 107, 0.3)' : 'rgba(0, 242, 96, 0.3)'}`
          }}>
            {paused ? 'PAUSED' : 'RUNNING'}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        gap: '20px'
      }}>
        <div
          style={{
            position: 'relative',
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
          onClick={handleFlap}
          onTouchStart={(e) => {
            e.preventDefault()
            handleFlap()
          }}
        >
          <canvas
            ref={canvasRef}
            width={640}
            height={640}
            style={{
              imageRendering: 'pixelated',
              border: '2px solid rgba(79, 172, 254, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              maxWidth: '100%',
              height: 'auto',
              cursor: 'pointer',
              touchAction: 'none'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '640px',
          width: '100%'
        }}>
          <button
            onClick={handleFlap}
            onTouchStart={(e) => {
              e.preventDefault()
              handleFlap()
            }}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(79, 172, 254, 0.4)',
              transition: 'transform 0.1s, box-shadow 0.1s',
              flex: '1',
              minWidth: '120px',
              touchAction: 'manipulation'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            FLAP
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(250, 112, 154, 0.4)',
              transition: 'transform 0.1s',
              flex: '1',
              minWidth: '120px',
              touchAction: 'manipulation'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            RESET
          </button>

          <button
            onClick={handleTogglePause}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              background: paused
                ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              boxShadow: paused
                ? '0 4px 16px rgba(255, 107, 107, 0.4)'
                : '0 4px 16px rgba(67, 233, 123, 0.4)',
              transition: 'transform 0.1s',
              flex: '1',
              minWidth: '120px',
              touchAction: 'manipulation'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {paused ? 'RESUME' : 'PAUSE'}
          </button>

          <button
            onClick={handleToggleUpsampler}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              background: useUpsampler
                ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              boxShadow: useUpsampler
                ? '0 4px 16px rgba(168, 237, 234, 0.4)'
                : '0 4px 16px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.1s',
              flex: '1',
              minWidth: '120px',
              touchAction: 'manipulation'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            UPSAMPLER {useUpsampler ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{
          padding: '12px 16px',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          textAlign: 'center',
          maxWidth: '640px',
          lineHeight: '1.6'
        }}>
          <div style={{ marginBottom: '4px', color: '#4facfe', fontWeight: '600' }}>
            Desktop: Space=Flap | R/Enter=Reset | .=Pause | U=Toggle Upsampler
          </div>
          <div style={{ color: '#00f2fe', fontWeight: '600' }}>
            Mobile: Tap screen or buttons to play
          </div>
        </div>
      </div>
    </div>
  )
}


