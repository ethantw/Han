const clampAxis = (value, size, edge = 0) =>
  size <= 2 * edge ? size / 2 : Math.min(Math.max(value, edge), size - edge)

/** Creates the replace-on-write state for one lens instance. */
export const createLensState = (finePointer) => ({
  on: finePointer,
  wide: !finePointer,
  readerDriving: false,
  clientX: null,
  clientY: null,
  lastX: 0,
  lastY: 0,
  lensSize: 0,
  zoom: 2,
  hostWidth: 0,
  hostHeight: 0,
})

/** Advances the fine-pointer aperture through small, large and closed. */
export const cycleLens = (state) => {
  if (!state.on) return { ...state, on: true, wide: false }
  if (!state.wide) return { ...state, wide: true }
  return { ...state, on: false, wide: false }
}

/** Clamps a sampling point to the host's content bounds. */
export const clampToBounds = ([x, y], [width, height]) => [
  clampAxis(x, width),
  clampAxis(y, height),
]

/** Clamps the painted lens while allowing a controlled edge overhang. */
export const clampLensCenter = ([x, y], [width, height], lensSize, overhang) => {
  const edge = lensSize / 2 - overhang
  return [clampAxis(x, width, edge), clampAxis(y, height, edge)]
}

/** Insets an opening-line anchor to obtain the lens's resting sample point. */
export const restingPoint = ([x, y, dx, dy], lensSize, zoom, bounds) => {
  const inset = 0.35 * (lensSize / (zoom || 1))
  return clampToBounds([x + dx * inset, y + dy * inset], bounds)
}

/** Builds the clone transform for a raw host-relative sample point. */
export const cloneTransform = ({ point, bounds, lensSize, zoom, scroll }) => {
  const half = lensSize / (2 * (zoom || 1))
  const sample = [
    clampAxis(point[0], bounds[0], half) + scroll[0],
    clampAxis(point[1], bounds[1], half) + scroll[1],
  ]
  return `translate(${lensSize / 2 - sample[0] * zoom}px, ${lensSize / 2 - sample[1] * zoom}px) scale(${zoom})`
}
