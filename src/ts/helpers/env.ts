export const isServerSide = (): boolean =>
  typeof document === 'undefined' || typeof CSS === 'undefined'

export const isBrowserSide = (): boolean => !isServerSide()
