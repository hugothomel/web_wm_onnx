export function quantizeToImageData(src: Float32Array, c: number, h: number, w: number, dst: ImageData) {
  // src in [-1,1], CHW planar (C contiguous planes)
  const out = dst.data
  const scaleY = dst.height / h
  const scaleX = dst.width / w
  const planeSize = h * w
  for (let y = 0; y < dst.height; y++) {
    const sy = Math.max(0, Math.min(h - 1, Math.floor(y / scaleY)))
    for (let x = 0; x < dst.width; x++) {
      const sx = Math.max(0, Math.min(w - 1, Math.floor(x / scaleX)))
      const idx = sy * w + sx
      const rV = src[0 * planeSize + idx]
      const gV = src[1 * planeSize + idx]
      const bV = src[2 * planeSize + idx]
      const r = Math.max(0, Math.min(255, Math.round(((rV + 1) * 0.5) * 255)))
      const g = Math.max(0, Math.min(255, Math.round(((gV + 1) * 0.5) * 255)))
      const b = Math.max(0, Math.min(255, Math.round(((bV + 1) * 0.5) * 255)))
      const di = (y * dst.width + x) * 4
      out[di + 0] = r
      out[di + 1] = g
      out[di + 2] = b
      out[di + 3] = 255
    }
  }
}


