"""
Rebrand the hero portal asset: remove the baked-in "TRISTYM" inscription from the
portal lintel and re-engrave "ZENITH" in a matching classical raised-gold style.

Why this exists:
  The source artwork (assets/_original/zenith-profile.original.png, 1179x2556) has the
  old brand "TRISTYM" rendered directly into the stone lintel. No CSS overlay can hide
  it reliably because the hero uses object-fit:cover, which crops the image differently
  at every viewport size. So we fix it at the pixel source.

Method:
  1. Reconstruct a clean lintel plate by sampling the plate's per-row gold gradient from
     the text-free left/right margins and filling the inscription area with it.
  2. Re-engrave "ZENITH" as raised polished-gold letters (depth shadow + bevel highlight
     + soft glow) so the portal itself reads ZENITH even with CSS disabled.

Usage:
  python tools/rebrand_portal.py            # writes final assets
  python tools/rebrand_portal.py --preview  # writes font-candidate comparison crops only
"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = "assets/_original/zenith-profile.original.png"
OUT_FILES = ["assets/zenith-profile.png", "assets/tristym-profile.png"]
PREVIEW_DIR = r"C:/Users/Tristan/AppData/Local/Temp/claude/C--Users-Tristan-Desktop-AI-SELL-SYSTEM-SORTIERT/7a256caa-5b21-483e-8711-ac8a7c796d42/scratchpad"

# --- Measured plate geometry (absolute px in the 1179x2556 source) ---
PLATE_L, PLATE_R = 368, 812          # gold plate outer left/right
FILL_L, FILL_R = 388, 798            # area to repaint (covers all glyphs, keeps bevel)
FILL_T, FILL_B = 1014, 1134          # vertical repaint band (full-width part of plate)
LEFT_SAMPLE = (374, 390)             # clean background strip left of the text
RIGHT_SAMPLE = (798, 808)            # clean background strip right of the text
TEXT_CX = (FILL_L + FILL_R) // 2     # horizontal center for engraving
TEXT_CY = 1074                       # vertical center for engraving
TARGET_W = 384                       # target inscription width (matches old TRISTYM)
TARGET_CAP = 74                      # target cap height in px

FONTS = {
    "palatino": "C:/Windows/Fonts/palab.ttf",
    "constantia": "C:/Windows/Fonts/constanb.ttf",
    "cambria": "C:/Windows/Fonts/cambriab.ttf",
}


def clean_plate(im):
    """Repaint the inscription area using the plate's per-row gold gradient."""
    px = im.load()
    for y in range(FILL_T, FILL_B):
        lc = _avg(px, LEFT_SAMPLE[0], LEFT_SAMPLE[1], y)
        rc = _avg(px, RIGHT_SAMPLE[0], RIGHT_SAMPLE[1], y)
        span = FILL_R - FILL_L
        for x in range(FILL_L, FILL_R):
            t = (x - FILL_L) / span
            r = int(lc[0] * (1 - t) + rc[0] * t)
            g = int(lc[1] * (1 - t) + rc[1] * t)
            b = int(lc[2] * (1 - t) + rc[2] * t)
            px[x, y] = (r, g, b)
    # subtle noise + micro-blur so the repaint matches the plate's texture
    region = im.crop((FILL_L, FILL_T, FILL_R, FILL_B)).filter(
        ImageFilter.GaussianBlur(0.6))
    im.paste(region, (FILL_L, FILL_T))
    return im


def _avg(px, x0, x1, y):
    r = g = b = n = 0
    for x in range(x0, x1):
        p = px[x, y]
        r += p[0]; g += p[1]; b += p[2]; n += 1
    return (r / n, g / n, b / n)


# Black phone Dynamic-Island pill baked into the screenshot's top. Its surroundings
# are near-flat dim-grey sky, so a per-row sample-and-fill inpaint is invisible.
ISLAND = (306, 22, 854, 158)
ISL_LSAMPLE = (150, 292)
ISL_RSAMPLE = (864, 1012)


def remove_island(im):
    px = im.load()
    x0, y0, x1, y1 = ISLAND
    span = x1 - x0
    for y in range(y0, y1):
        lc = _avg(px, ISL_LSAMPLE[0], ISL_LSAMPLE[1], y)
        rc = _avg(px, ISL_RSAMPLE[0], ISL_RSAMPLE[1], y)
        for x in range(x0, x1):
            t = (x - x0) / span
            px[x, y] = (int(lc[0] * (1 - t) + rc[0] * t),
                        int(lc[1] * (1 - t) + rc[1] * t),
                        int(lc[2] * (1 - t) + rc[2] * t))
    region = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(0.7))
    im.paste(region, (x0, y0))
    return im


def _fit_font(path, text, target_w, target_cap):
    """Pick a font size whose cap height ~= target_cap, plus tracking to hit target_w."""
    size = 10
    f = ImageFont.truetype(path, size)
    while True:
        asc = f.getbbox("ZENITH")
        cap = asc[3] - asc[1]
        if cap >= target_cap or size > 400:
            break
        size += 2
        f = ImageFont.truetype(path, size)
    # measure raw width (no tracking) then derive per-letter tracking to fit target_w
    raw = f.getbbox(text)
    raw_w = raw[2] - raw[0]
    track = max(0, (target_w - raw_w) / max(1, len(text) - 1))
    return f, track


def _draw_tracked(draw, xy, text, font, fill, track, anchor_center=True):
    # measure full tracked width
    widths = []
    for ch in text:
        bb = font.getbbox(ch)
        widths.append(bb[2] - bb[0])
    total = sum(widths) + track * (len(text) - 1)
    x = xy[0] - total / 2 if anchor_center else xy[0]
    top = xy[1]
    for ch, w in zip(text, widths):
        bb = font.getbbox(ch)
        draw.text((x - bb[0], top), ch, font=font, fill=fill)
        x += w + track


def engrave(im, font_path, text="ZENITH"):
    """Render raised polished-gold inscription centered on the lintel."""
    SS = 4
    pad = 60
    crop_box = (PLATE_L - pad, FILL_T - pad, PLATE_R + pad, FILL_B + pad)
    base = im.crop(crop_box).convert("RGBA")
    W, H = base.size
    big = (W * SS, H * SS)
    cx = (TEXT_CX - crop_box[0]) * SS
    cy = (TEXT_CY - crop_box[1]) * SS

    font, track = _fit_font(font_path, text, TARGET_W * SS, TARGET_CAP * SS)
    # cap-center the baseline: getbbox top offset
    bb = font.getbbox(text)
    cap_h = bb[3] - bb[1]
    top = cy - cap_h / 2 - bb[1]

    # --- text mask ---
    mask = Image.new("L", big, 0)
    md = ImageDraw.Draw(mask)
    _draw_tracked(md, (cx, top), text, font, 255, track)

    # --- depth shadow (below-right, gives the carved/raised depth) ---
    shadow = Image.new("RGBA", big, (0, 0, 0, 0))
    sh_mask = mask.filter(ImageFilter.GaussianBlur(SS * 1.6))
    sh_col = Image.new("RGBA", big, (38, 22, 4, 255))
    shadow = Image.composite(sh_col, shadow, sh_mask)
    shadow = _offset(shadow, SS * 2, SS * 3)
    shadow.putalpha(shadow.getchannel("A").point(lambda a: int(a * 0.58)))

    # --- outer warm glow (matches the plate's luminosity) ---
    glow = Image.new("RGBA", big, (0, 0, 0, 0))
    gl_mask = mask.filter(ImageFilter.GaussianBlur(SS * 5))
    gl_col = Image.new("RGBA", big, (255, 214, 130, 255))
    glow = Image.composite(gl_col, glow, gl_mask)
    glow.putalpha(glow.getchannel("A").point(lambda a: int(a * 0.42)))

    # --- gold gradient body ---
    grad = _v_gradient(big, [(0.0, (248, 233, 170)),
                             (0.42, (235, 205, 120)),
                             (0.72, (208, 158, 70)),
                             (1.0, (176, 124, 48))], bb, top, cap_h)
    gold = Image.new("RGBA", big, (0, 0, 0, 0))
    gold.paste(grad, (0, 0), mask)

    # --- top-left bevel highlight (raised rim) ---
    hi_rim = ImageChops_subtract(mask, _offset_mask(mask, SS * 2, SS * 2))
    hi = Image.new("RGBA", big, (0, 0, 0, 0))
    hi_col = Image.new("RGBA", big, (255, 246, 214, 255))
    hi = Image.composite(hi_col, hi, hi_rim.filter(ImageFilter.GaussianBlur(SS * 0.6)))
    hi.putalpha(hi.getchannel("A").point(lambda a: int(a * 0.7)))

    # --- composite stack onto plate (all at supersampled resolution) ---
    out = base.resize(big, Image.LANCZOS)
    out = Image.alpha_composite(out, glow)
    out = Image.alpha_composite(out, shadow)
    out = Image.alpha_composite(out, gold)
    out = Image.alpha_composite(out, hi)
    out = out.resize((W, H), Image.LANCZOS)

    result = im.convert("RGBA").copy()
    result.paste(out, (crop_box[0], crop_box[1]), out)
    return result.convert("RGB")


def _offset(img, dx, dy):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (dx, dy))
    return out


def _offset_mask(mask, dx, dy):
    out = Image.new("L", mask.size, 0)
    out.paste(mask, (dx, dy))
    return out


def ImageChops_subtract(a, b):
    from PIL import ImageChops
    return ImageChops.subtract(a, b)


def _v_gradient(size, stops, bb, top, cap_h):
    """Vertical gradient confined to the cap band (top..top+cap_h)."""
    W, H = size
    grad = Image.new("RGB", size, stops[-1][1])
    g = grad.load()
    y0 = int(top + bb[1])
    y1 = int(top + bb[1] + cap_h)
    for y in range(H):
        t = (y - y0) / max(1, (y1 - y0))
        t = min(1.0, max(0.0, t))
        col = _interp(stops, t)
        for x in range(W):
            g[x, y] = col
    return grad


def _interp(stops, t):
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= t <= t1:
            f = (t - t0) / max(1e-6, (t1 - t0))
            return (int(c0[0] + (c1[0] - c0[0]) * f),
                    int(c0[1] + (c1[1] - c0[1]) * f),
                    int(c0[2] + (c1[2] - c0[2]) * f))
    return stops[-1][1]


def preview():
    im0 = Image.open(SRC).convert("RGB")
    cleaned = clean_plate(im0.copy())
    box = (300, 960, 880, 1180)
    cleaned.crop(box).save(f"{PREVIEW_DIR}/clean_only.png")
    for name, path in FONTS.items():
        res = engrave(cleaned.copy(), path)
        res.crop(box).save(f"{PREVIEW_DIR}/cand_{name}.png")
        print("wrote candidate", name)


def build(font_choice="palatino"):
    im0 = Image.open(SRC).convert("RGB")
    cleaned = clean_plate(im0.copy())
    cleaned = remove_island(cleaned)
    res = engrave(cleaned, FONTS[font_choice])
    for out in OUT_FILES:
        res.save(out)
        print("wrote", out)


if __name__ == "__main__":
    if "--preview" in sys.argv:
        preview()
    else:
        choice = "palatino"
        for a in sys.argv[1:]:
            if a in FONTS:
                choice = a
        build(choice)
