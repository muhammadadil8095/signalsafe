"""Write simple PNG toolbar icons without third-party dependencies."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path


def png(size: int, rgb: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b""
    for y in range(size):
        raw += b"\x00" + rgb[y * size * 3 : (y + 1) * size * 3]
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def draw(size: int) -> bytes:
    pixels = bytearray(size * size * 3)
    cabinet = (12, 18, 24)
    fluor = (61, 255, 154)
    cyan = (94, 233, 255)
    for y in range(size):
        for x in range(size):
            i = (y * size + x) * 3
            pixels[i : i + 3] = bytes(cabinet)
            # tray
            if size * 0.28 < y < size * 0.78 and size * 0.18 < x < size * 0.82:
                pixels[i : i + 3] = bytes((10, 16, 22))
            # fluorescence band
            if size * 0.48 < y < size * 0.62 and size * 0.22 < x < size * 0.78:
                pixels[i : i + 3] = bytes(fluor)
            # cyan tick
            if size * 0.18 < y < size * 0.26 and size * 0.22 < x < size * 0.42:
                pixels[i : i + 3] = bytes(cyan)
    return png(size, bytes(pixels))


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "public" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        (out / f"icon-{size}.png").write_bytes(draw(size))
    print(f"wrote icons in {out}")


if __name__ == "__main__":
    main()
