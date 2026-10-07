# Bundled flag images

These 197 SVG flags correspond to the country codes in src/data/countries.ts.
They were downloaded from https://flagcdn.com/{code}.svg on 2026-10-07.
The game loads these local assets; it does not request images from FlagCDN at runtime.
Vite copies public/flags into dist/flags when building.
