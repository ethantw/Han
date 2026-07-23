/**
 * Browser-build stand-in for `happy-dom` (see `library.js`'s
 * BROWSER_TS_BUNDLE_CONFIG). hyperly only reaches for happy-dom on its
 * non-browser branch (`isBrowserSide` is false), which in a browser
 * bundle is unreachable — but the `import('happy-dom')` literal alone
 * makes bundlers pull in happy-dom's Node built-ins (`url`, `buffer`)
 * and fail the build. Aliasing to this stub keeps the module graph
 * browser-clean; the throw is a tripwire in case the unreachable branch
 * ever becomes reachable.
 */
export class Window {
  constructor() {
    throw new Error(
      '[han.css] happy-dom browser stub constructed — '
        + 'the browser bundle must never take the SSR branch.',
    )
  }
}
