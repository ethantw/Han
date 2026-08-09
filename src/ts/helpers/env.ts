/** True in Node/SSR — no `document` to mutate, no `CSS` to query. */
export const isServerSide = (): boolean =>
  typeof document === 'undefined' || typeof CSS === 'undefined'

/** True in a real browser: DOM present and `CSS.supports` answerable. */
export const isBrowserSide = (): boolean => !isServerSide()
