"""
Spoken dialogue (owner, 2026-10-23: replace the browser's text-to-speech with generated voices).
Each character's voice is a Kokoro synthetic voice (no real person's), pitched to suit them; Chatterbox
then speaks the line in that voice with an emotion setting. Runs on the owner's ComfyUI (port 8188) through
the comfyui-spellcaster-tts nodes; the same graph is saved there as the "T2S - Chatterbox" workflow.

    python assets-src/scripts/ai/voices.py samples          # two lines per main character
    python assets-src/scripts/ai/voices.py <line-id> ...    # particular lines

Writes assets-src/voices/<line-id>.flac (samples: assets-src/voices/samples/<speaker>_<line-id>.flac).
"""
import os
import re
import sys
import uuid

from comfy import FLUX, ROOT, download, run

DIALOGUE = os.path.join(ROOT, "src", "content", "dialogue.ts")
OUT = os.path.join(ROOT, "assets-src", "voices")

# A neutral passage each reference voice reads (Chatterbox copies the voice, not the words).
REFERENCE_TEXT = (
    "Welcome to the academy. Today you will learn your very first spell, and I will be right here to help you. "
    "Listen carefully, take your time, and remember that every mistake teaches us something new."
)

# Kokoro voice, pitch shift (semitones), Chatterbox exaggeration (0.5 neutral, higher more dramatic), cfg
# weight (lower is slower and more deliberate) and loudness (LUFS; every line is normalised, higher is louder).
# Pip keeps the browser's voice (owner, 2026-10-23: "I like the original Pip's voice"), so has no entry.
CASTING = {
    # Mira: a brave older student.
    "mira": dict(voice="bf_emma", pitch=0.0, exaggeration=0.65, cfg=0.45, lufs=-16),
    # Keeper Orin: the warm old headmaster (owner: "Orin is soft").
    "orin": dict(voice="bm_george", pitch=-1.0, exaggeration=0.6, cfg=0.45, lufs=-14),
    # The Ward Warden (owner: "more bombastic and commanding, and louder").
    "warden": dict(voice="bm_daniel", pitch=-4.0, exaggeration=1.0, cfg=0.35, lufs=-12),
    # The Unwriter (owner: "more sinister"): lower, slower, menacing.
    "unwriter": dict(voice="bm_lewis", pitch=-3.0, exaggeration=0.75, cfg=0.3, lufs=-15),
}

# Lines that need more than their character's usual delivery, and words said differently from the subtitle
# (the same words; only punctuation that shapes the delivery).
LINE_STYLE = {
    # Owner: "when Mira says run, it doesn't sound like RUN!"
    "east-1": dict(exaggeration=1.2, cfg=0.3),
}
SPOKEN = {
    "east-1": "You're the new apprentice? I'm Mira, a student here. Run! The library books are loose!",
}
# An exclaimed line gets a little more energy than the character's usual delivery.
EXCLAIM_BOOST = 0.15

SAMPLES = {
    "mira": ["east-1", "east-run-3"],
    "orin": ["l2-orin-1", "l2-orin-ward"],
    "warden": ["court-warden-say", "fracture-warden"],
    "unwriter": ["l2-voice-1", "l2-voice-wyrm"],
}


def load_lines():
    """{line id: (speaker, text)} from the game's script."""
    src = open(DIALOGUE, encoding="utf-8").read()
    lines = {}
    for m in re.finditer(r"'([\w-]+)':\s*line\('([\w-]+)',\s*'((?:[^'\\]|\\.)*)'", src):
        lines[m.group(1)] = (m.group(2), m.group(3).replace("\\'", "'"))
    return lines


def spoken(text):
    """The Warden's lines are written in capitals for the subtitles; speech wants ordinary sentences."""
    if text.isupper():
        text = re.sub(r"(^|[.!?]\s+)([a-z])", lambda m: m.group(1) + m.group(2).upper(), text.lower())
        text = re.sub(r"\bi\b", "I", text)
    return text


def graph(text, cast, prefix, seed=1):
    return {
        "1": {"class_type": "KokoroTTS", "inputs": {"text": REFERENCE_TEXT, "voice": cast["voice"], "speed": 1.0}},
        "2": {"class_type": "AudioPitchShift", "inputs": {"audio": ["1", 0], "semitones": cast["pitch"]}},
        "3": {"class_type": "ChatterboxTTS", "inputs": {"text": text, "exaggeration": cast["exaggeration"], "cfg_weight": cast["cfg"], "temperature": 0.8, "seed": seed, "reference_audio": ["2", 0]}},
        "5": {"class_type": "AudioLoudness", "inputs": {"audio": ["3", 0], "target_lufs": cast["lufs"]}},
        "4": {"class_type": "SaveAudio", "inputs": {"audio": ["5", 0], "filename_prefix": prefix}},
    }


def delivery(line_id, speaker, text):
    """The character's casting, with the line's own adjustments."""
    cast = dict(CASTING[speaker])
    if text.rstrip().endswith("!"):
        cast["exaggeration"] = min(2.0, cast["exaggeration"] + EXCLAIM_BOOST)
    cast.update(LINE_STYLE.get(line_id, {}))
    return cast


def speak(line_id, speaker, text, out_path):
    if speaker not in CASTING:
        print(f"skip {line_id}: {speaker} keeps the browser voice", flush=True)
        return
    cast = delivery(line_id, speaker, text)
    # A fresh file name every time: ComfyUI's Save Audio sometimes reported an older numbered file in a
    # nested folder, which brought back a previous take.
    prefix = f"spellcaster_voice_{line_id}_{uuid.uuid4().hex[:8]}"
    entry = run(FLUX, graph(spoken(SPOKEN.get(line_id, text)), cast, prefix), timeout=900)
    files = [f for node in entry["outputs"].values() for f in node.get("audio", [])]
    download(FLUX, files[0], out_path)
    print(out_path, flush=True)


def main():
    lines = load_lines()
    args = sys.argv[1:]
    if args == ["samples"]:
        for speaker, ids in SAMPLES.items():
            for line_id in ids:
                who, text = lines[line_id]
                speak(line_id, who, text, os.path.join(OUT, os.environ.get("SAMPLES_DIR", "samples"), f"{speaker}_{line_id}.flac"))
        return
    for line_id in args:
        who, text = lines[line_id]
        speak(line_id, who, text, os.path.join(OUT, f"{line_id}.flac"))


if __name__ == "__main__":
    main()
