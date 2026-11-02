# Fonts

## Special Elite (`special-elite-latin-centred.woff2`)

- Font by Astigmatic (Brian J. Bonislawsky), licensed under the Apache License 2.0 (`SpecialElite-LICENSE.txt`).
- Source: the Latin subset from `@fontsource/special-elite` 5.3.0 (the Google Fonts build).
- **Modified (2026-11-02):** only the vertical metrics were changed, so that figures and capitals sit in
  the middle of the line. In the original, the ascent/descent (1440 / 608 units of 2048) put the line's
  centre about 0.15 em below the middle of the figures, so typed numbers looked raised in their boxes.
  New values: ascent 1744, descent 304, line gap 0 (hhea, OS/2 typo and win). The total (2048, one em)
  is unchanged, so line heights do not change. The glyph outlines are untouched.

Cormorant Garamond and Alegreya Sans come from `@fontsource` packages (SIL Open Font License),
imported in `src/main.tsx`. All fonts are served from this site; the page makes no requests to Google.
