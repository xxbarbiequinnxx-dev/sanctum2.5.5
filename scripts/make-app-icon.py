#!/usr/bin/env python3
"""Build Sanctum gold heart-padlock icons from the master mark."""

from __future__ import annotations

import struct
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path("/workspace")
MASTER = ROOT / "artifacts/imagine_images/34e53d25-bc91-46e8-b57a-3a1e6781681e.jpg"
PUBLIC = ROOT / "public"
ANDROID_RES = ROOT / "native/android/app/src/main/res"

INK = (12, 10, 11, 255)
GOLD = (212, 175, 55, 255)


def fit_master(size: int) -> Image.Image:
    src = Image.open(MASTER).convert("RGBA")
    # crush near-black to true ink so JPEG halos don't show
    px = src.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 28 and g < 28 and b < 28:
                px[x, y] = INK
    return src.resize((size, size), Image.Resampling.LANCZOS)


def heart_padlock(size: int, *, background: bool) -> Image.Image:
    scale = 8 if size <= 256 else 4
    s = size * scale
    img = Image.new("RGBA", (s, s), INK if background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    stroke = max(2, int(s * 0.075))
    # shackle
    left, right = s * 0.34, s * 0.66
    top = s * 0.14
    mid = s * 0.42
    draw.arc((left, top, right, mid + (right - left) * 0.15), 200, 340, fill=GOLD, width=stroke)
    # heart body
    cx, cy = s / 2, s * 0.58
    hw, hh = s * 0.30, s * 0.28
    # two lobes + point via polygon approximation
    pts = []
    import math

    for i in range(64):
        t = math.pi * 2 * i / 64
        # classic heart parametric
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x / 16 * hw, cy - y / 16 * hh))
    draw.polygon(pts, fill=GOLD)
    # keyhole
    kr = s * 0.048
    kcx, kcy = cx, s * 0.55
    draw.ellipse((kcx - kr, kcy - kr, kcx + kr, kcy + kr), fill=INK if background else (12, 10, 11, 255))
    draw.polygon(
        [
            (kcx - kr * 0.55, kcy + kr * 0.3),
            (kcx + kr * 0.55, kcy + kr * 0.3),
            (kcx + kr * 0.35, kcy + kr * 2.4),
            (kcx - kr * 0.35, kcy + kr * 2.4),
        ],
        fill=INK if background else (12, 10, 11, 255),
    )
    return img.resize((size, size), Image.Resampling.LANCZOS)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def write_icns(path: Path, images: dict[str, Image.Image]) -> None:
    chunks: list[bytes] = []
    for ostype, image in images.items():
        buf = BytesIO()
        image.save(buf, "PNG", optimize=True)
        data = buf.getvalue()
        chunks.append(ostype.encode("ascii") + struct.pack(">I", 8 + len(data)) + data)
    body = b"".join(chunks)
    path.write_bytes(b"icns" + struct.pack(">I", 8 + len(body)) + body)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name, size in {
        "icon-1024.png": 1024,
        "icon-512.png": 512,
        "icon-192.png": 192,
        "icon-180.png": 180,
        "favicon-32.png": 32,
    }.items():
        save_png(fit_master(size), PUBLIC / name)

    save_png(fit_master(180), PUBLIC / "__grok/icon-180.png")
    save_png(fit_master(512), PUBLIC / "icon-rounded-512.png")

    android = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in android.items():
        save_png(fit_master(size), ANDROID_RES / folder / "ic_launcher.png")

    save_png(heart_padlock(432, background=False), ANDROID_RES / "drawable" / "ic_launcher_foreground.png")
    save_png(fit_master(512), ROOT / "native/android/play-icon-512.png")

    write_icns(
        PUBLIC / "AppIcon.icns",
        {
            "ic08": fit_master(256),
            "ic09": fit_master(512),
            "ic10": fit_master(1024),
            "ic12": fit_master(64),
            "ic13": fit_master(256),
            "ic14": fit_master(512),
        },
    )
    print("wrote gold heart-padlock icons")


if __name__ == "__main__":
    main()
