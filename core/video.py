"""Pluggable video capture. New sources must not require rewriting tactics."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Iterator, Optional

import cv2
import numpy as np


@dataclass(frozen=True)
class VideoMetadata:
    width: int
    height: int
    fps: float
    frame_count: Optional[int]
    source_type: str
    path: str


class VideoSource(ABC):
    @abstractmethod
    def open(self) -> None: ...

    @abstractmethod
    def read(self) -> tuple[bool, Optional[np.ndarray]]: ...

    @abstractmethod
    def metadata(self) -> VideoMetadata: ...

    @abstractmethod
    def close(self) -> None: ...

    def frames(self, max_frames: Optional[int] = None) -> Iterator[tuple[int, np.ndarray]]:
        self.open()
        try:
            i = 0
            while True:
                ok, frame = self.read()
                if not ok or frame is None:
                    break
                yield i, frame
                i += 1
                if max_frames is not None and i >= max_frames:
                    break
        finally:
            self.close()


class _CaptureSource(VideoSource):
    source_type = "capture"

    def __init__(self, target, source_type: str):
        self.target = target
        self.source_type = source_type
        self._cap: Optional[cv2.VideoCapture] = None

    def open(self) -> None:
        self._cap = cv2.VideoCapture(self.target)
        if self._cap is None or not self._cap.isOpened():
            raise RuntimeError(f"Could not open video source: {self.target}")

    def read(self) -> tuple[bool, Optional[np.ndarray]]:
        if self._cap is None:
            raise RuntimeError("Source is not open.")
        ok, frame = self._cap.read()
        return ok, frame if ok else None

    def metadata(self) -> VideoMetadata:
        opened = self._cap is not None
        if not opened:
            self.open()
        cap = self._cap
        assert cap is not None
        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        if fps <= 0:
            fps = 30.0
        count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        frame_count = int(count) if count and count > 0 else None
        meta = VideoMetadata(
            width=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0),
            height=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0),
            fps=float(fps),
            frame_count=frame_count,
            source_type=self.source_type,
            path=str(self.target),
        )
        if not opened:
            self.close()
        return meta

    def close(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None


class FileVideoSource(_CaptureSource):
    def __init__(self, path: str):
        super().__init__(path, "file")


class WebcamVideoSource(_CaptureSource):
    def __init__(self, device_index: int = 0):
        super().__init__(device_index, "webcam")


class RTSPVideoSource(_CaptureSource):
    def __init__(self, url: str):
        super().__init__(url, "rtsp")


class NetworkVideoSource(_CaptureSource):
    def __init__(self, url: str):
        super().__init__(url, "network")


class StreamVideoSource(_CaptureSource):
    def __init__(self, url: str):
        super().__init__(url, "stream")


class PhoneCameraSource(_CaptureSource):
    """Phone cameras typically arrive as a network/RTSP/WebRTC URL from the client."""

    def __init__(self, url: str):
        super().__init__(url, "phone")


def open_source(kind: str, target: str | int) -> VideoSource:
    kind = kind.lower().strip()
    mapping = {
        "file": lambda: FileVideoSource(str(target)),
        "webcam": lambda: WebcamVideoSource(int(target)),
        "rtsp": lambda: RTSPVideoSource(str(target)),
        "network": lambda: NetworkVideoSource(str(target)),
        "stream": lambda: StreamVideoSource(str(target)),
        "phone": lambda: PhoneCameraSource(str(target)),
    }
    if kind not in mapping:
        raise ValueError(f"Unknown video source '{kind}'.")
    return mapping[kind]()
