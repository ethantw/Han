/**
 * Shift+M — put the page's moving parts back where they started.
 *
 * A development affordance, not a reader feature: the loupes and the four
 * pan-strips are stateful (a loupe remembers where the reader last pointed
 * it, a strip stops auto-centring once the reader has scrolled it), so
 * checking a change to either normally means reloading the whole page.
 * This dispatches one `han-dev-reset` on `document`; every stateful module
 * subscribes and restores its own opening state — the modules keep owning
 * their state, this only says «now».
 *
 * Shift+M and not a bare key: a bare letter would fire while the reader is
 * typing in the playground. Typing targets are skipped anyway, belt and
 * braces.
 */

export const DEV_RESET = 'han-dev-reset'

export const initDevReset = () => {
  addEventListener('keydown', (e) => {
    if (!e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return
    // `key`, not `code`: Shift+M is the CHARACTER M, whatever layout produced it.
    if (e.key !== 'M' && e.key !== 'm') return
    if (e.target?.closest?.('input, textarea, select, [contenteditable]')) return
    document.dispatchEvent(new CustomEvent(DEV_RESET))
  })
}
