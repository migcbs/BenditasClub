# DESIGN.md — Benditas Club

<!-- impeccable:design-schema 1 -->

## Status

Redesign in progress (2026-09-03). Ground truth is `BrandingBC.pdf` (the
official brand manual, kept local/untracked in the repo root — see
`.gitignore`). Before this pass, every surface invented its own
approximation of the brand: at least 5 different "pink" hex values, an
unrelated orange (`#ff4d00` in Navbar.css), a gold/amber that does not exist
anywhere in the brand manual, and four different font stacks (Inter, Arimo,
Pontano Sans, Josefin Sans — the last two never actually loaded, silently
falling back to the browser default). This file is the single source of
truth going forward; every surface should read its colors and fonts from
here, never invent a new value locally.

## Brand truth (from BrandingBC.pdf)

- **Pink** — the only real brand color. Measured directly from the manual's
  swatches (not the printed CMYK, which drifts on-screen): `#E765B7`.
- **Cream / "hueso"** — soft off-white used as an alternate to pure white.
  Measured: `#FFFDCF`.
- **Black** and **white** — used for negatives/inversions (dark backgrounds,
  high-contrast print).
- **Fonts** — Titan One (headlines, already correct and already loaded),
  Bright Demo and Subway Circle Demo (tagline + small accent labels like
  "EST. 2017"). The last two are demo/trial cuts with no confirmed
  commercial license — the user chose to substitute them with a free,
  visually-close alternative rather than ship unlicensed font files:
  **Fredoka** (rounded, friendly, huge weight range, pairs cleanly with
  Titan One) replaces both for taglines and small accent labels.
- Mascot: "Pollito", a winged chick in sunglasses with a halo, plus
  secondary characters (Doggy, Chelo, Burggy) for texture use. Line-art
  style: bold pink outline on light background, or white/cream outline on
  pink/black. This is illustration, not a UI pattern — it informs tone
  (playful, irreverent) but the app does not attempt to redraw it.

## Tokens

```css
--bp-pink:       #E765B7;  /* primary — CTAs, active states, accents */
--bp-pink-deep:  #C43D8F;  /* pressed/hover state for pink fills */
--bp-cream:      #FFFDCF;  /* alternate background, warmer than pure white */
--bp-ground:     #FFF8F0;  /* default app background (existing, kept —
                                slightly warmer than cream, reads better
                                behind dense UI than the brand's flat cream) */
--bp-ink:        #241A20;  /* body text, headings, icons on light */
--bp-ink-soft:   #6E5C66;  /* secondary/muted text */
--bp-white:      #FFFFFF;
--bp-error:      #C62838;
--bp-success:    #2E7D4F;
```

No gold/amber, no orange. Every prior use of `#c98a1f`, `#ff4d00`,
`#d1477f`, `#e78fbb`, `#e78fbb`-adjacent values maps to `--bp-pink` (or
`--bp-pink-deep` for a hover/gradient partner — never a second hue).

**Contrast note:** `--bp-pink` on `--bp-cream`/`--bp-white`/`--bp-ground`
measures ~2.9:1 — well short of the 4.5:1 body-text minimum. Pink is never
used as text color on a light background. It is used as: a fill (with
`--bp-ink` text on top, which clears ~5.5:1), a border/icon accent at large
sizes (3:1 non-text threshold), or text on a dark/pink fill. Body copy is
always `--bp-ink` or `--bp-ink-soft`.

## Typography

- **Titan One** — page/section titles, the brand wordmark, hero headlines.
  Never for paragraphs, buttons, or form labels (it has no lowercase
  refinement for dense reading).
- **Fredoka** (weights 500/600/700) — taglines, small accent labels, badges,
  stat numbers next to a Titan One heading. The "voice" layer between a big
  Titan One title and plain body copy.
- **Inter** — everything else: body copy, buttons, form fields, table/list
  content, nav links. The one accessible workhorse font for the whole app.
  Replaces Arimo, Pontano Sans, and Josefin Sans everywhere they appeared.

## Shape & surface language

- **Buttons**: pill-shaped (`border-radius: 999px`) for primary actions,
  `--bp-pink` fill with `--bp-ink` text (bold, no uppercase transform),
  `--bp-pink-deep` on hover/press. Secondary buttons: `--bp-ink` 2px
  outline, transparent fill, `--bp-ink` text. Never a pink-to-gold or
  pink-to-orange gradient — those colors don't exist in the brand.
- **Glass panels** (popups, dialogs, elevated cards): already correct in
  `src/shared/theme.js`'s `glassSx` — `rgba(255,255,255,0.72)` fill,
  `blur(18px) saturate(160%)`, a hairline `rgba(36,26,32,0.08)` border. This
  is the app's "liquid glass" treatment (light-mode, since dark mode was
  explicitly rejected earlier in the project) — extend it to every popup,
  not just Admin/POS.
- **Radius**: 18px on cards/panels/inputs, 999px (pill) on buttons/chips.
- **Motion**: entrance opacity never starts at 0 (starts 0.6–0.85) — a
  lesson learned earlier in the project from animations getting stuck
  invisible when a tab loses focus mid-transition.

## Surfaces (status as of this pass)

| Surface | Before | After |
|---|---|---|
| Admin / POS / Cocina / Recepción | Closest to correct already (glass + pill buttons) but wrong hex (`#d1477f`/`#c98a1f`) and two unloaded fonts | Same structure, corrected tokens |
| Home / Navbar | Orange `--primary-color`, Arimo/Segoe fallback body text | Corrected tokens, same layout |
| Pedido popup (`/#menu` checkout) | Its own ad-hoc pink→gold gradient buttons, unrelated to Shop or Admin | Same pill/glass button language as the rest of the app |
| Shop / carrito | Closest of the public surfaces (Inter body, Titan One heading) but pink was a lighter approximation | Corrected pink token, buttons aligned to the shared pill style |
| Customer profile (`/perfil`) | Already MUI/theme.js-driven, mostly correct | Corrected via the same theme.js token fix |

## Explicitly out of scope this pass

- Styles.css carries a large amount of apparently-dead/duplicate CSS (e.g.
  a second `.navbar` block) predating this redesign. Colors/fonts inside it
  were corrected, but no dead-code removal was attempted — that's a
  separate cleanup, flagged, not silently done here.
- The mascot illustrations themselves were not redrawn or added to new
  surfaces — this pass is UI chrome (buttons, popups, typography, color),
  not illustration work.
