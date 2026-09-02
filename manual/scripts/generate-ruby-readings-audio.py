# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = [
#   "beautifulsoup4>=4.13",
#   "dragonmapper>=0.3.0",
#   "kokoro>=0.9.4",
#   "misaki[zh]>=0.9.4",
#   "numpy>=2.0",
#   "soundfile>=0.13",
#   "torch>=2.5",
#   "transformers>=4.39,<5",
# ]
# ///

"""Generate recordings from the ruby authored in the homepage reading station.

The station partial is the single source of truth for base text, phonetic annotations
and explicit TTS overrides. This script only converts that markup into model
input; it does not carry a second reading dictionary.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from bs4 import BeautifulSoup, NavigableString, Tag
from dragonmapper import transcriptions
from kokoro import KModel, KPipeline
from pypinyin import load_phrases_dict
from transformers import AutoTokenizer, VitsModel


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "manual/home/station-readings.html"
OUTPUT = ROOT / "manual/public/audio/ruby-readings"
ELEMENT_OUTPUT = OUTPUT / "elements-minnan"

MMS_REPO = "facebook/mms-tts-nan"
KOKORO_REPO = "hexgrad/Kokoro-82M-v1.1-zh"
KOKORO_VOICE = "zf_001"
PAUSES = {"，": 0.18, "；": 0.32, "：": 0.24, "。": 0.48}


def base_text(tag: Tag):
    """Return ruby base text while excluding every annotation."""
    result = []
    for child in tag.children:
        if isinstance(child, NavigableString):
            result.append(str(child))
        elif isinstance(child, Tag) and child.name != "rt":
            result.append(base_text(child))
    return "".join(result).strip()


def direction_matches(tag: Tag, direction: str):
    classes = set(tag.get("class", ()))
    return not (
        ("HorizontalOnly" in classes and direction == "left")
        or ("VerticalOnly" in classes and direction == "right")
    )


def tokens_from_root(root: Tag, annotation_lang: str, direction: str):
    """Crawl visible base text and readings in document order."""
    result = []

    def visit(node):
        if isinstance(node, NavigableString):
            value = str(node)
            if value.strip():
                result.append(("bare", value))
            return
        if not isinstance(node, Tag) or not direction_matches(node, direction):
            return
        if node.name == "br" or node.has_attr("hidden"):
            return
        if node.name != "ruby":
            for child in node.children:
                visit(child)
            return

        native = [
            rt
            for rt in node.find_all("rt")
            if rt.get("lang") == annotation_lang
        ]
        direct_roman = next(
            (
                rt
                for rt in node.find_all("rt", recursive=False)
                if "Latn" in rt.get("lang", "")
            ),
            None,
        )
        roman = (
            direct_roman.get_text(" ", strip=True)
            if direct_roman is not None
            else " ".join(rt.get("aria-label", "") for rt in native).strip()
        )
        if not native or not roman:
            raise ValueError(
                f"Missing {annotation_lang} or roman reading for ruby {base_text(node)!r}"
            )
        result.append(
            (
                "annotated",
                base_text(node),
                " ".join(rt.get_text(" ", strip=True) for rt in native),
                roman,
            )
        )

    visit(root)
    return result


def language_tokens(
    document: BeautifulSoup,
    content_lang: str,
    annotation_lang: str,
    direction: str,
):
    dispatch = document.select_one(f'.Dispatch[lang="{content_lang}"]')
    if dispatch is None:
        raise ValueError(f"Missing dispatch for {content_lang}")
    return [
        token
        for paragraph in dispatch.find_all("p", recursive=False)
        for token in tokens_from_root(paragraph, annotation_lang, direction)
    ]


def minnan_dispatch_segments(document: BeautifulSoup, direction: str):
    title = document.select_one('#story-title > h2[lang="zh-nan-Hant-TW"]')
    dispatch = document.select_one('.Dispatch[lang="zh-nan-Hant-TW"]')
    if title is None or dispatch is None:
        raise ValueError("Missing Min Nan title or dispatch")
    tokens = tokens_from_root(title, "nan-Bopo-TW", direction)
    for paragraph in dispatch.find_all("p", recursive=False):
        tokens.extend(tokens_from_root(paragraph, "nan-Bopo-TW", direction))

    result = []
    words = []
    for token in tokens:
        if token[0] == "annotated":
            words.append(token)
            continue
        punctuation = next((mark for mark in token[1] if mark in PAUSES), None)
        if words and punctuation:
            result.append(
                (
                    "".join(word[1] for word in words),
                    "-".join(word[3] for word in words),
                    punctuation,
                )
            )
            words = []
    if words:
        result.append(
            (
                "".join(word[1] for word in words),
                "-".join(word[3] for word in words),
                "。",
            )
        )
    return tuple(result)


def clauses(tokens, value_index: int):
    result = []
    words = []
    for token in tokens:
        if token[0] == "annotated":
            words.append(token[value_index])
            continue
        punctuation = token[1]
        if words:
            result.append((" ".join(words), punctuation, tuple(words)))
            words = []
    if words:
        result.append((" ".join(words), "。", tuple(words)))
    return result


def join_with_pauses(parts, sample_rate: int):
    audio = []
    for waveform, punctuation in parts:
        waveform = np.asarray(waveform, dtype=np.float32).reshape(-1)
        audio.append(waveform)
        pause = PAUSES.get(punctuation, 0.18)
        audio.append(np.zeros(round(sample_rate * pause), dtype=np.float32))
    joined = np.concatenate(audio)
    peak = float(np.max(np.abs(joined)))
    return joined if peak == 0 else joined * (0.94 / peak)


def normalize(waveform, peak: float = 0.94):
    waveform = np.asarray(waveform, dtype=np.float32).reshape(-1)
    current_peak = float(np.max(np.abs(waveform)))
    return waveform if current_peak == 0 else waveform * (peak / current_peak)


def fade_edges(waveform, sample_rate: int, duration: float = 0.018):
    waveform = np.asarray(waveform, dtype=np.float32).copy().reshape(-1)
    fade_samples = min(round(sample_rate * duration), len(waveform) // 2)
    if fade_samples:
        fade = np.sin(np.linspace(0, np.pi / 2, fade_samples)) ** 2
        waveform[:fade_samples] *= fade
        waveform[-fade_samples:] *= fade[::-1]
    return waveform


def stable_element_audio(element, tokenizer, model):
    """Retry stochastic MMS output when a short syllable contains an impulse."""
    candidates = []
    for attempt in range(12):
        seed = 2000 + element["atomic"] + attempt * 1000
        waveform = normalize(render_mms(element["tailo"], tokenizer, model, seed))
        peak = float(np.max(np.abs(waveform)))
        step_ratio = float(np.max(np.abs(np.diff(waveform)))) / peak
        candidates.append((step_ratio, seed, waveform))
        # Ratios close to 1 indicate an isolated full-scale impulse. Normal
        # consonant attacks in this model remain well below this threshold.
        if attempt == 0 and step_ratio < 0.75:
            return waveform

    step_ratio, seed, waveform = min(candidates, key=lambda candidate: candidate[0])
    print(f"Retried {element['symbol']} with seed {seed} (step ratio {step_ratio:.3f})")
    return waveform


def load_mms():
    tokenizer = AutoTokenizer.from_pretrained(MMS_REPO)
    model = VitsModel.from_pretrained(MMS_REPO).eval()
    return tokenizer, model


def render_mms(text: str, tokenizer, model, seed: int):
    inputs = tokenizer(text.lower(), return_tensors="pt")
    torch.manual_seed(seed)
    with torch.no_grad():
        return model(**inputs).waveform[0].cpu().numpy()


def minnan_dispatch_input(document: BeautifulSoup, direction: str):
    spaces = {"，": 3, "；": 5, "：": 4, "。": 7}
    return "".join(
        tailo + " " * spaces.get(punctuation, 3)
        for _, tailo, punctuation in minnan_dispatch_segments(document, direction)
    ).rstrip().lower()


def generate_minnan(document: BeautifulSoup, direction: str):
    tokenizer, model = load_mms()
    sample_rate = model.config.sampling_rate
    # Run the complete dispatch through MMS in one inference. Restarting VITS
    # at every clause causes noticeable timbral drift even with a fixed random
    # seed. The approved mix of hyphens and single spaces controls phrasing;
    # repeated spaces preserve rhetorical breaks without resetting acoustic
    # state. The connected input is naturally faster, so ease it back to pace.
    model.speaking_rate = 0.86
    full_tailo = minnan_dispatch_input(document, direction)
    waveform = render_mms(full_tailo, tokenizer, model, 1687)
    waveform = fade_edges(normalize(waveform), sample_rate)
    return waveform, sample_rate


def normalize_zhuyin(zhuyin: str):
    # Dragonmapper expects the neutral-tone dot after the syllable.
    return re.sub(r"˙([^ ]+)", r"\1˙", zhuyin)


def force_mandarin_readings(tokens):
    pronunciations = {}
    for token in tokens:
        if token[0] != "annotated":
            continue
        _, hanzi, zhuyin, _ = token
        pinyin = transcriptions.zhuyin_to_pinyin(normalize_zhuyin(zhuyin))
        syllables = pinyin.split()
        if len(syllables) != len(hanzi):
            raise ValueError(f"Reading length mismatch: {hanzi} -> {pinyin}")
        pronunciations[hanzi] = [[syllable] for syllable in syllables]
    load_phrases_dict(pronunciations)


def generate_mandarin(tokens):
    force_mandarin_readings(tokens)
    model = KModel(repo_id=KOKORO_REPO).to("cpu").eval()
    pipeline = KPipeline(
        lang_code="z",
        repo_id=KOKORO_REPO,
        model=model,
        en_callable=lambda text: "",
    )
    rendered = []

    for hanzi, punctuation, _ in clauses(tokens, 1):
        # Remove token-separating spaces; punctuation is rendered as silence.
        result = next(pipeline(hanzi.replace(" ", ""), voice=KOKORO_VOICE, speed=1.0))
        rendered.append((result.audio.cpu().numpy(), punctuation))

    return join_with_pauses(rendered, 24_000), 24_000


def write_wave(name: str, waveform, sample_rate: int):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT / f"{name}.wav"
    sf.write(destination, waveform, sample_rate, subtype="PCM_16")
    print(destination.relative_to(ROOT))
    if ffmpeg := shutil.which("ffmpeg"):
        mp3 = destination.with_suffix(".mp3")
        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                destination,
                "-codec:a",
                "libmp3lame",
                "-q:a",
                "2",
                mp3,
            ],
            check=True,
        )
        print(mp3.relative_to(ROOT))


def element_data(document: BeautifulSoup):
    elements = []
    for button in document.select('button[name="speak-element"]'):
        atomic = button.select_one(':scope > ruby > rt data')
        phonetic = button.select_one(':scope > ruby > ruby.zhuyin')
        reading = button.select_one('rt[lang="nan-Bopo-TW"]')
        if atomic is None or phonetic is None or reading is None:
            raise ValueError(f"Incomplete element ruby: {button.get('value')}")
        names = button.get("title", "").split("・")[1].split("／", 1)
        elements.append(
            {
                "atomic": int(atomic["value"]),
                "symbol": button["value"],
                "hant": base_text(phonetic),
                "hans": names[1],
                "tailo": reading["aria-label"],
            }
        )

    if len(elements) != 4:
        raise ValueError(f"Expected 4 elements, got {len(elements)}")
    return elements


def minnan_heading(document: BeautifulSoup, selector: str):
    heading = document.select_one(selector)
    if heading is None:
        raise ValueError(f"Missing heading: {selector}")
    tokens = tokens_from_root(heading, "nan-Bopo-TW", "right")
    return (
        "".join(token[1] for token in tokens if token[0] == "annotated"),
        "-".join(token[3] for token in tokens if token[0] == "annotated"),
    )


def encode_mp3(waveform, sample_rate: int, destination: Path, title: str):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg is required to generate element MP3 files")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="han-elements-") as temp_dir:
        wave = Path(temp_dir) / "source.wav"
        sf.write(wave, waveform, sample_rate, subtype="PCM_16")
        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                wave,
                "-codec:a",
                "libmp3lame",
                "-q:a",
                "2",
                "-metadata",
                f"title={title}",
                "-metadata",
                "artist=facebook/mms-tts-nan",
                "-metadata",
                "copyright=CC BY-NC 4.0",
                destination,
            ],
            check=True,
        )


def generate_elements_minnan(document: BeautifulSoup):
    elements = element_data(document)
    heading_hant, heading_tailo = minnan_heading(
        document,
        '#elements-title > h2[lang="zh-nan-Hant-TW"]',
    )
    tokenizer, model = load_mms()
    sample_rate = model.config.sampling_rate
    gap = np.zeros(round(sample_rate * 0.28), dtype=np.float32)
    combined = []

    for index, element in enumerate(elements):
        core = stable_element_audio(element, tokenizer, model)
        padded = np.concatenate(
            [
                np.zeros(round(sample_rate * 0.08), dtype=np.float32),
                core,
                np.zeros(round(sample_rate * 0.20), dtype=np.float32),
            ]
        )
        encode_mp3(
            padded,
            sample_rate,
            ELEMENT_OUTPUT / f"{element['symbol']}.mp3",
            f"{element['hant']} ({element['tailo']})",
        )
        combined.append(fade_edges(normalize(core, peak=0.82), sample_rate))
        if index < len(elements) - 1:
            combined.append(gap)

    heading = fade_edges(
        normalize(
            render_mms(heading_tailo, tokenizer, model, seed=1687),
            peak=0.82,
        ),
        sample_rate,
    )
    all_audio = np.concatenate(
        [
            np.zeros(round(sample_rate * 0.08), dtype=np.float32),
            heading,
            np.zeros(round(sample_rate * 0.46), dtype=np.float32),
            *combined,
            np.zeros(round(sample_rate * 0.28), dtype=np.float32),
        ]
    )
    encode_mp3(all_audio, sample_rate, ELEMENT_OUTPUT / "all.mp3", "元素合讀")

    manifest = {
        "language": "nan-TW",
        "model": MMS_REPO,
        "license": "CC BY-NC 4.0",
        "combinedPrefix": {
            "hant": heading_hant,
            "tailo": heading_tailo,
        },
        "order": [element["symbol"] for element in elements],
        "elements": elements,
    }
    (ELEMENT_OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{ELEMENT_OUTPUT.relative_to(ROOT)}: {len(elements) + 1} MP3 files")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--direction",
        choices=("right", "left", "both"),
        default="right",
        help="Generate the horizontal 如右 version, vertical 如左 version, or both.",
    )
    parser.add_argument(
        "--elements",
        action="store_true",
        help="Generate four individual Min Nan element MP3s and one combined MP3.",
    )
    parser.add_argument(
        "--language",
        choices=("both", "minnan", "mandarin"),
        default="both",
        help="Limit dispatch generation to one language.",
    )
    parser.add_argument(
        "--print-input",
        action="store_true",
        help="Print the exact Min Nan tokenizer input and exit.",
    )
    args = parser.parse_args()
    document = BeautifulSoup(SOURCE.read_text(encoding="utf-8"), "html.parser")
    if args.elements:
        generate_elements_minnan(document)
        return
    directions = ("right", "left") if args.direction == "both" else (args.direction,)

    for direction in directions:
        suffix = "" if direction == "right" else "-left"

        if args.print_input:
            full_tailo = minnan_dispatch_input(document, direction)
            visible = re.sub(
                r" {2,}",
                lambda match: f" [停頓×{len(match.group())}] ",
                full_tailo,
            )
            print(f"{direction} raw:\n{full_tailo!r}")
            print(f"{direction} visible:\n{visible}")
            print(f"{direction} paired:")
            spaces = {"，": 3, "；": 5, "：": 4, "。": 7}
            for hanzi, tailo, punctuation in minnan_dispatch_segments(
                document, direction
            ):
                print(f"{hanzi}{punctuation}\n{tailo}")
                if punctuation != "。" or hanzi != "對圖紙搬入深空船塢":
                    print(f"[停頓×{spaces[punctuation]}]")
            continue

        if args.language in ("both", "minnan"):
            waveform, sample_rate = generate_minnan(document, direction)
            write_wave(f"dispatch-minnan{suffix}", waveform, sample_rate)

        if args.language in ("both", "mandarin"):
            mandarin = language_tokens(
                document,
                "zh-Hant-TW",
                "zh-Bopo-TW",
                direction,
            )
            waveform, sample_rate = generate_mandarin(mandarin)
            write_wave(f"dispatch-mandarin{suffix}", waveform, sample_rate)


if __name__ == "__main__":
    main()
