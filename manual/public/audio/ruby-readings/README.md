# Ruby readings demo audio

The visible base text and readings in `manual/home/station-readings.html` are the
single source of truth. The generator crawls that authored ruby and converts it
to model input; the demo JavaScript only chooses a recording or browser voice
and never maintains a second pronunciation dictionary.

- Files without a direction suffix use the horizontal-layout wording `如右`.
- Files ending in `-left` use the vertical-layout wording `如左`.

- `dispatch-minnan.*` was synthesized with Meta's
  [`facebook/mms-tts-nan`](https://huggingface.co/facebook/mms-tts-nan),
  licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  The model receives the HTML-authored Tailo rather than Hanzi.
  The recording includes the localized headline before the dispatch body and
  is arranged, segmented, and post-processed by this project.
- `dispatch-mandarin.*` was synthesized with
  [`hexgrad/Kokoro-82M-v1.1-zh`](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh),
  licensed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).
  The model receives phonemes derived from the HTML's Zhuyin readings so that
  polyphonic Hanzi are not inferred from context.
- `elements-minnan/` contains four individual element-name MP3 files plus
`all.mp3`, which reads the same recordings continuously in the order used by
the homepage station. The combined recording begins with the localized element-table
  heading crawled from the HTML. `manifest.json` records the prefix, symbol,
  atomic number, Hanzi, Tailo, order, model, and license.

Regenerate the WAV masters and, when `ffmpeg` is installed, MP3 copies from
the repository root:

```sh
uv run manual/scripts/generate-ruby-readings-audio.py
uv run manual/scripts/generate-ruby-readings-audio.py --direction left
uv run manual/scripts/generate-ruby-readings-audio.py --direction both --language minnan
uv run manual/scripts/generate-ruby-readings-audio.py --elements
```
