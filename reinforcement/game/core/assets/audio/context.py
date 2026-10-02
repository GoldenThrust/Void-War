from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class GainParams:
    value: float = 1.0
    minValue: float = 0.0
    maxValue: float = 1.0


@dataclass
class GainNode:
    gain: GainParams = field(default_factory=GainParams)

    def connect(self, _target=None):
        return self


@dataclass
class BufferSource:
    buffer: object | None = None
    loop: bool = False
    onended: object | None = None

    def connect(self, _target=None):
        return self

    def start(self):
        if callable(self.onended):
            self.onended()


@dataclass
class AudioContext:
    destination: object = object()

    def createGain(self) -> GainNode:
        return GainNode()

    def createBufferSource(self) -> BufferSource:
        return BufferSource()

    def decodeAudioData(self, audio_data):
        return audio_data


audioCtx = AudioContext()
