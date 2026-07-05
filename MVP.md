# Ayah Studio MVP

## Purpose

Ayah Studio prepares respectful vertical Quran reel projects for `@tilawat_alquran30`.
The MVP is a local-first Web Mobile tool that helps choose ayahs, preview the reel,
document sources, and hand off clean project data for a future FFmpeg renderer.

## Technology Decision

- Frontend: plain HTML, CSS, and JavaScript so the prototype opens directly from one folder.
- Runtime: browser-first, with optional local web server for PWA behavior and bundled data loading.
- Storage: browser `localStorage` for settings and imported Quran data when space allows.
- Export handoff: JSON project file, PNG preview, export manifest, and FFmpeg command plan.
- Backend path: FFmpeg plus a safe Arabic text renderer for final MP4 production. The first local FFmpeg script lives in `scripts/export-mp4.mjs`.

## Quran Text Source

- Production Quran text must come from a reviewed Uthmani Mushaf source.
- The preferred local file path is `data/quran-uthmani.json`.
- The app accepts either a `surahs` JSON shape or a flat ayah list, documented in `data/README.md`.
- The user must record source name, URL, edition, and mark the source reviewed before export.
- The app must not generate Quran text with AI or allow casual manual editing of ayah text.

## Quran Font Decision

- Final MP4 export needs an approved Uthmani Quran font.
- The prototype uses browser fallback fonts for preview only.
- The export manifest reserves `UTHMANI_QURAN_FONT.ttf` as a required backend input.
- Font choice must be reviewed against readability and correct Uthmani display before production.

## Licensing Policy

- Uploaded recitation videos, backgrounds, logos, and source visuals must be reviewed before production use.
- Custom backgrounds require source name, source URL when available, license type, and no-attribution approval.
- Internal placeholder SVG backgrounds are acceptable for preview, but are marked not export-ready for final MP4.
- Final videos should not contain external watermarks, photographer marks, or source logos.

## Recognition Policy

- Current recognition is advisory only.
- Browser audio analysis estimates active recitation duration and suggests ayah count.
- Filename and timing hints may help review workflow, but they must not change the selected surah or ayah automatically.
- Future surah/ayah recognition should prefer ASR transcription followed by exact normalized matching against the reviewed Quran text.
- The first recognition pass should use the first 7 seconds of recitation; if no unique match is found, the app expands the analysis window.
- If matching returns multiple possible ayahs, the app shows the candidates for user choice and must not select automatically.
- Automatic suggestion is allowed only for one unique exact normalized match. Nearest-match or approximate Quran selection is not allowed.
- The user must manually confirm surah, starting ayah, and ayah count before export.
- Real surah/ayah recognition remains a future feature.

## Export Policy

- The browser prototype does not create a real MP4 directly.
- Current exports are project JSON, preview PNG, export manifest, and FFmpeg plan.
- A local backend script can render MP4 when FFmpeg and real reviewed input files are supplied.
- Final MP4 export must preserve the original recitation audio without speed, pitch, or content changes.
- Arabic shaping, line wrapping, and final compositing should happen in the backend renderer.

## MVP Complete When

- A reviewed Quran JSON source can be loaded.
- A recitation video can be previewed in 9:16.
- Ayah selection, timing, template, background, reciter, and account identity are saved.
- Pre-export review gates block unsafe handoff.
- JSON/PNG/manifest/FFmpeg plan can be downloaded for the next production phase.
