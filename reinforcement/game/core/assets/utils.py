from __future__ import annotations

from .audio.context import audioCtx


def playAudio(buffer, gain, loop: bool = False):
    source = audioCtx.createBufferSource()
    source.connect(gain).connect(audioCtx.destination)
    source.loop = loop
    source.buffer = buffer
    source.start()
    return source


def throtlePlayAudio(buffer, gain):
    playing = {"value": False}

    def _play():
        if not playing["value"]:
            playing["value"] = True
            source = playAudio(buffer, gain)

            def _reset():
                playing["value"] = False

            source.onended = _reset

    return _play
