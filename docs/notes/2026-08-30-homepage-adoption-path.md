# Homepage adoption path

The manual homepage now treats adoption as one continuous route rather than a
collection of specimens. This note records the lasting decisions from the
completed landing-page work.

## Entry

The hero pairs the product definition with two concrete actions: the install
command and a 30-second quickstart. The quickstart is a lightweight dialog with
the minimum CSS and optional JavaScript setup, support status and a route to the
full manual. Every homepage language uses the same information structure.

The console trigger names its current action and remains discoverable on a
small screen. Once used, its persistent compact state avoids competing with
the page content.

## Route and exit

One station roster owns identifiers, numbers, names and summaries. Desktop and
mobile navigation present that same route at different densities. Current
station tracking uses `IntersectionObserver`; direct hashes, reload and browser
history retain native scrolling behaviour.

The craft and playground stations pass the current configuration into the code
generator. The page closes with three primary routes: use the framework, read
the manual or participate in development. Related font projects remain credits,
not competing calls to action.

## Accessibility and performance boundaries

- Console, carousel, rail and dialog interactions remain keyboard operable.
- Dynamic labels, current station and carousel position are announced.
- Sticky mobile controls do not capture the document's scrolling surface.
- Configuration changes avoid synchronous full-page measurement; expensive DOM
  fallbacks remain explicitly represented rather than presented as free.

The adoption pass was accepted against 320, 390, 768 and 1440 px viewport
regressions. Its final audit ran 148 homepage/manual browser cases: 147 passed,
with one Chromium-project skip reserved for a WebKit-only probe.

The pre-entry visual checkpoint remains tagged
`landing-page-pre-entry-20260829` for historical comparison.
