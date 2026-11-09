---
name: Pastel Sanctuary
colors:
  surface: '#faf8ff'
  surface-dim: '#d1d9fb'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ebedff'
  surface-container-high: '#e3e7ff'
  surface-container-highest: '#dbe1ff'
  on-surface: '#121a34'
  on-surface-variant: '#444653'
  inverse-surface: '#272f4a'
  inverse-on-surface: '#eff0ff'
  outline: '#747685'
  outline-variant: '#c4c5d5'
  surface-tint: '#3355c6'
  primary: '#3355c6'
  on-primary: '#ffffff'
  primary-container: '#6b8afd'
  on-primary-container: '#002173'
  inverse-primary: '#b7c4ff'
  secondary: '#634eb1'
  on-secondary: '#ffffff'
  secondary-container: '#ac97ff'
  on-secondary-container: '#3f288b'
  tertiary: '#1b6a56'
  on-tertiary: '#ffffff'
  tertiary-container: '#569f88'
  on-tertiary-container: '#003126'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0f3bad'
  secondary-fixed: '#e7deff'
  secondary-fixed-dim: '#ccbeff'
  on-secondary-fixed: '#1e0060'
  on-secondary-fixed-variant: '#4b3597'
  tertiary-fixed: '#a6f2d7'
  tertiary-fixed-dim: '#8bd5bc'
  on-tertiary-fixed: '#002118'
  on-tertiary-fixed-variant: '#00513f'
  background: '#faf8ff'
  on-background: '#121a34'
  surface-variant: '#dbe1ff'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
This design system defines a calm, memory-keeping and personal address space tailored for Android. The experience balances soft tactile warmth with minimalist clarity: intimate without feeling juvenile, airy without feeling sterile. The atmosphere evokes opening a lovingly kept personal journal dipped in morning light. 

Visually, the style merges **soft modern minimalism** with **subtle frosted glass accents** and **fluid pill-shaped geometries**. Visual clutter is eradicated; interactions rely on intentional hierarchy, calm negative space, and gentle transitions. The emotional takeaway is quiet reassurance, warmth, and effortless focus on personal connections and cherished memories.

## Colors
The palette is built around soothing, dreamy periwinkle and lilac undertones set over an airy off-white backdrop, accented by soft botanical pastels.

- **Canvas & Backgrounds:** The base canvas uses `#F8F9FE` with a soft secondary tint of `#F5F6FC`. This creates an ethereal, restful backdrop that reduces eye strain compared to harsh stark white.
- **Brand Primaries:** `#6B8AFD` (Periwinkle Blue) anchors navigation anchors and primary focal points. `#9B86ED` (Soft Lilac) complements milestone memories, personal tags, and secondary interactions.
- **Accents & Celebrations:** Muted pastel highlights are reserved for tag categorization, memory tokens, and visual badges: Soft Mint (`#A5F0D6`), Warm Butter (`#FEE8B0`), and Rose Blush (`#F8B4D9`).
- **Surfaces & Cards:** Elevated surfaces use solid pure white (`#FFFFFF`) or translucent frosted white (`rgba(255, 255, 255, 0.75)`), enclosed by micro-borders of `#E9ECF8`.
- **Text & Semantics:** Primary typography relies on Deep Muted Slate (`#232B45`) for soft contrast, and Gentle Slate Gray (`#6A7694`) for metadata, hints, and timestamps. Destructive and urgent states use a softened coral pastel (`#F2788A`), never aggressive reds.

## Typography
**Plus Jakarta Sans** is employed universally across headlines, body copy, and UI controls. Its geometric clarity combined with humanistic, slightly rounded stroke endings introduces warmth without forfeiting legibility.

Letter-spacing is kept default for body text and tightened slightly (`-0.02em`) on headlines to enhance editorial cohesion. Numerical information—such as birth dates, anniversaries, and phone numbers—benefits from the font's clean tabular-compatible forms. Strong typographic hierarchy eliminates the need for divider lines or decorative dividers between list items.

## Layout & Spacing
Designed exclusively for an ergonomic Android handheld footprint:

- **Rhythm & Grid:** Built on an absolute 4px/8px modular spacing rhythm. A 4-column fluid mobile layout with 20px (`1.25rem`) outer safe-area margins provides breathing room on modern edge-to-edge displays.
- **Vertical Hierarchy:** Generous section spacing (`space-xl` / 32px) ensures cards, memories, and timeline anchors do not compete for attention.
- **Touch Targets:** Interactive pill controls and list row triggers maintain a minimum interactive hit area of 48×48dp, even when visual badge containers are compact.

## Elevation & Depth
Elevation in this system eschews heavy drop shadows in favor of **ambient, tinted luminous glows** and **frosted translucency**:

- **Surface Tiers:** Cards feature a base elevation with soft, extended blur radii tinted with the primary hue: `0 8px 24px -4px rgba(107, 138, 253, 0.08)`.
- **Ghost Borders:** All cards and interactive chips pair this ambient shadow with a crisp, low-contrast border (`1px solid #E9ECF8`) to define crisp boundaries against light backgrounds.
- **Translucent Overlays:** The persistent bottom navigation bar and sticky date headers adopt frosted glass (`background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`), grounding the UI while preserving a lightweight, floating feel.

## Shapes
The visual identity embraces **Level 3 (Pill-shaped)** architecture:
- Action triggers, category chips, status pills, and bottom bar floating containers utilize full stadium pill radii (`9999px` or `2rem`).
- Cards, modal bottom sheets, and address containers use generous radii between `24px` (`rounded-lg`) and `32px` (`rounded-xl`).
- The organic, rounded silhouette conveys tenderness, safety, and modern approachability across all Android viewport resolutions.

## Components

- **Bottom Navigation Bar:** A floating frosted pill navigation bar suspended 16px above the Android system gesture bar. Hosts exactly three destinations: *Inicio*, *Calendario*, and *Ajustes*. Active states employ a soft periwinkle capsule background (`#6B8AFD` at 12% opacity) enclosing the icon and label in `#6B8AFD`.
- **Cards & Memory Modules:** Pure white `#FFFFFF` cards with 24px rounded corners, 1px `#E9ECF8` borders, and ambient lilac-blue shadows. Memory cards feature generous padding (`space-lg`), containing circular avatar tokens, key relation metadata, and expandable memory notes.
- **Buttons & Floating Actions:** Primary actions use full-pill silhouettes filled with `#6B8AFD` and crisp white typography. Secondary action buttons use subtle lavender tints (`#9B86ED` at 10% fill) with `#9B86ED` text. No aggressive drop shadows; tap feedback uses a soft inward scale down to 97%.
- **Chips & Quick Filters:** Pill-shaped tags with 12px horizontal padding and 6px vertical padding. Inactive tags feature `#F8F9FE` background with `#6A7694` text. Categorical tags utilize soft accent fills (Mint `#A5F0D6`, Butter `#FEE8B0`, Blush `#F8B4D9`) at 35% opacity paired with deep tone-matched text.
- **Lists & Contacts:** Clean cardless contact rosters separated purely by spatial grouping (`space-md`) and gentle typography rather than dividing lines. Each entry pairs a 44dp circular avatar tinted in pastel gradients with two-line primary and secondary text.
- **Input Fields:** Soft pill or rounded 16px inputs filled with `#F5F6FC`, surrounded by a transparent border that transitions into `#6B8AFD` upon focus. Placeholder text sits in `#6A7694`.
- **Selection Controls:** Checkboxes and radio toggles feature circular, pill-aligned geometries with animated lavender checkfills and smooth scaling transitions.