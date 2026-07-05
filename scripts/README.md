# Ayah Studio Export Scripts

## MP4 Exporter

`export-mp4.mjs` is the first local backend path for real MP4 rendering with FFmpeg.
It reads an Ayah Studio project JSON file and combines:

- a real background image or video,
- the original recitation video audio,
- reviewed Quran text timing from the project JSON,
- a generated ASS subtitle overlay for ayah timing,
- an approved Uthmani font,
- an optional account logo.

Dry run:

```powershell
node scripts\export-mp4.mjs `
  --project ayah-studio-project.json `
  --video SOURCE_RECITATION_VIDEO.mp4 `
  --background BACKGROUND_VIDEO_OR_IMAGE.mp4 `
  --font UTHMANI_QURAN_FONT.ttf `
  --subtitles output.ayahs.ass `
  --out output.mp4
```

Render:

```powershell
node scripts\export-mp4.mjs `
  --project ayah-studio-project.json `
  --video SOURCE_RECITATION_VIDEO.mp4 `
  --background BACKGROUND_VIDEO_OR_IMAGE.mp4 `
  --font UTHMANI_QURAN_FONT.ttf `
  --subtitles output.ayahs.ass `
  --out output.mp4 `
  --execute
```

The script writes the subtitle overlay before rendering. It preserves the original recitation audio from the uploaded video and does not change speed, pitch, or audio content.

Dry-run self-test:

```powershell
node scripts\test-mp4-export-plan.mjs
```

This test creates temporary placeholder inputs, runs `export-mp4.mjs` without `--execute`, and verifies that the FFmpeg command and ASS subtitle overlay are generated. It does not require FFmpeg and does not render a final MP4.

Render smoke test:

```powershell
node scripts\test-mp4-render-smoke.mjs
```

This test creates temporary two-second media inputs, runs `export-mp4.mjs --execute`, and verifies that an MP4 file is produced. If FFmpeg is unavailable or lacks the `subtitles` filter, it prints `SKIP` and exits successfully so local checks still pass on machines without FFmpeg.

FFmpeg discovery:

```powershell
node scripts\find-ffmpeg.mjs
```

This checks `--ffmpeg`, the `FFMPEG` environment variable, `PATH`, and common Windows install locations, then confirms the `subtitles` filter needed for ASS ayah overlays. If it finds a ready executable, pass it to render commands with `--ffmpeg`.

## Production Notes

- FFmpeg must be installed and available in `PATH`, or passed with `--ffmpeg`.
- The FFmpeg build must support the `subtitles` filter/libass for the generated ASS overlay.
- The project JSON must show reviewed Quran source and confirmed ayah selection.
- Arabic shaping and line wrapping should still be visually reviewed before production publishing.
- Placeholder SVG backgrounds are for preview; use a reviewed production background file for final MP4.

## Readiness Audit

Before rendering, run:

```powershell
node scripts\audit-readiness.mjs `
  --project ayah-studio-project.json `
  --manifest ayah-studio-export-manifest.json `
  --video SOURCE_RECITATION_VIDEO.mp4 `
  --background BACKGROUND_VIDEO_OR_IMAGE.mp4 `
  --font UTHMANI_QURAN_FONT.ttf `
  --font-manifest assets\quran-font.example.json
```

The audit checks project gates, timing, FFmpeg availability, `subtitles` filter/libass support, source video, background media, reviewed Quran font file, optional Quran font metadata, and manifest missing inputs.

## Quran Data Validator

Before importing a full Quran file from an online source, validate the source authority manifest:

```powershell
node scripts\validate-quran-source-authority.mjs `
  --file data\quran-source-authority.king-fahd.example.json `
  --source-url OFFICIAL_DOWNLOAD_URL
```

This checks the documented authority URLs, accepted source domains, accepted formats, and optional review flag. It does not download or certify the Quran text by itself.

After adding a reviewed Quran text file, run:

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json
```

The validator accepts the same nested `surahs` shape and flat ayah-list shape documented in `data/README.md`. It checks the 114-surah catalog and expected 6,236 ayahs, then reports incomplete surahs. It does not certify textual correctness.
It also checks required source metadata, the raw source SHA-256 hash, and basic text quality so obvious placeholder strings or non-Arabic ayah text cannot pass readiness.

To normalize an official source file before validation:

```powershell
node scripts\prepare-quran-data.mjs `
  --input data\source\king-fahd-quran-source.json `
  --output data\quran-uthmani.json `
  --source-name "King Fahd Glorious Quran Printing Complex" `
  --source-url "https://qurancomplex.gov.sa/" `
  --source-edition "Madinah Mushaf Uthmani Unicode dataset"
```

The preparer accepts JSON, CSV, TXT shaped as `surah|ayah|text`, and common official flat fields such as `sora`, `sura_no`, `aya_no`, and `aya_text`. It normalizes the data for Ayah Studio and records a SHA-256 hash of the raw source text; it does not replace human review against the trusted Mushaf source.

To fetch the current QuranEnc `arabic_text` source and prepare `data\quran-uthmani.json`:

```powershell
node scripts\fetch-quranenc-uthmani.mjs
```

This downloads all 114 surahs from QuranEnc, extracts only `result[].arabic_text`, writes `data\source\quranenc-uthmani.json`, prepares `data\quran-uthmani.json`, and validates 6,236 ayahs. It does not mark the source reviewed.

To write Quran source review evidence before marking the source reviewed:

```powershell
node scripts\write-quran-source-review-report.mjs --out quran-source-review-report.md
```

The report records source metadata, Quran coverage, raw SHA-256 comparison, authority status, and the exact review-gate commands. It does not certify text correctness or replace human comparison.

To run the source archive, prepare, validate, and optional checklist steps with one command:

```powershell
node scripts\import-quran-source.mjs `
  --input data\source\king-fahd-quran-source.json `
  --source-url "OFFICIAL_DOWNLOAD_URL" `
  --authority data\quran-source-authority.king-fahd.example.json `
  --source-name "King Fahd Glorious Quran Printing Complex" `
  --source-edition "Madinah Mushaf Uthmani Unicode dataset" `
  --checklist production-readiness-checklist.md
```

After human comparison against the trusted Mushaf source, the same command can mark the source reviewed by adding `--reviewed-by` and `--review-note`.

For a machine-readable Quran data report:

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json --json
```

For production readiness, require the human review flag:

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json --require-reviewed
```

After human comparison against the trusted Mushaf source, mark the source reviewed without editing the JSON by hand:

```powershell
node scripts\mark-quran-source-reviewed.mjs `
  --file data\quran-uthmani.json `
  --reviewed-by "Reviewer Name" `
  --review-note "Compared against the official Mushaf source."
```

To test the local prepare/validate pipeline without adding Quran text to the repository:

```powershell
node scripts\test-quran-data-pipeline.mjs
```

To test the one-command import flow without adding Quran text to the repository:

```powershell
node scripts\test-quran-source-import.mjs
```

To test trusted-source authority checks:

```powershell
node scripts\test-quran-source-authority.mjs
```

## Background Catalog Validator

To add or update a licensed background entry with a local file hash:

```powershell
node scripts\add-background-catalog-entry.mjs `
  --catalog assets\licensed-backgrounds.example.json `
  --file assets\production\makkah.mp4 `
  --id makkah-production `
  --name "Makkah Production" `
  --category landmark `
  --source-name "Licensed Provider" `
  --source-url "https://example.com/license" `
  --license "Licensed for social publishing" `
  --reviewed `
  --export-ready
```

This writes the file path, SHA-256 hash, source, license, and review flags into the catalog. It does not replace human license review.

Before importing a production background catalog, run:

```powershell
node scripts\validate-background-catalog.mjs --file assets\licensed-backgrounds.example.json
```

To also require every referenced media file to exist locally:

```powershell
node scripts\validate-background-catalog.mjs --file assets\licensed-backgrounds.example.json --require-files
```

The validator checks required metadata, unique ids, source URLs, license text, and `reviewed/exportReady` flags. It does not replace human license review.
When `--require-files` is used, it also checks that referenced files exist and that `sha256` matches the local file when present.

## Recognition Engine Manifest Validator

Before treating audio recognition as production-ready, document the recognition engine:

```powershell
node scripts\validate-recognition-manifest.mjs --file assets\recognition-engine.example.json
```

To also require the local model file:

```powershell
node scripts\validate-recognition-manifest.mjs --file assets\recognition-engine.example.json --require-model-file
```

The manifest must identify the provider, version, source URL, method, support for surah detection, ayah-start detection, confidence scoring, and reviewed/export-ready status. Manual confirmation must remain required.

Preferred non-manual recognition path:

1. Convert the first 7 seconds of recitation audio to Arabic text with local `whisper.cpp`.
2. Match that transcript against the reviewed Quran text with exact normalized matching.
3. If one unique location matches, import it as an unconfirmed suggestion.
4. If multiple locations match, show all candidates for user choice.
5. If none match, extend the analysis window and transcribe more audio.

To match a transcript against the reviewed Quran text:

```powershell
node scripts\match-quran-transcript.mjs `
  --quran data\quran-uthmani.json `
  --transcript "TRANSCRIBED_TEXT" `
  --analyzed-seconds 7 `
  --next-analysis-seconds 15 `
  --json
```

This command never returns a nearest match. It returns `unique`, `ambiguous`, or `not-found`.

Adopted free ASR option:

- Provider: `whisper.cpp local`
- Executable path expected by the manifest: `tools\whisper.cpp\Release\whisper-cli.exe`
- Model path expected by the manifest: `tools\whisper.cpp\models\ggml-small.bin`
- Status: selected but not production-ready until installed and validated on recitation samples.

Current recognition verdict:

- The browser/backend flow is only a trial recognizer.
- `whisper.cpp` can miss or distort Quran recitation text, so it cannot be treated as a guaranteed surah/ayah detector.
- OCR fallback is only for visible text in silent videos and must never auto-select a verse.
- Production readiness remains blocked until an exact, reviewed Quran recognition path is adopted, such as a complete ayah fingerprint library or another engine that returns exact-match evidence.

To run the local whisper.cpp path after installing the executable and model:

```powershell
node scripts\transcribe-and-match-whispercpp.mjs `
  --audio SOURCE_RECITATION_VIDEO.mp4 `
  --quran data\quran-uthmani.json `
  --whisper tools\whisper.cpp\Release\whisper-cli.exe `
  --model tools\whisper.cpp\models\ggml-small.bin `
  --analyzed-seconds 7 `
  --json
```

For phone-browser testing, serve the app and backend from the computer:

```powershell
node scripts\serve-mobile-backend.mjs `
  --host 0.0.0.0 `
  --port 4173
```

Open `http://COMPUTER_LAN_IP:4173/` on the phone. The browser uploads media to the backend endpoint `/api/transcribe-match`; FFmpeg and `whisper.cpp` run on the computer, not inside the phone browser.

To build an exact ayah-by-ayah audio fingerprint library from a URL template:

```powershell
node scripts\build-recognition-fingerprint-library.mjs `
  --source-template "https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/{surah3}{ayah3}.mp3" `
  --provider EveryAyah `
  --version AbdulSamad_64kbps_QuranExplorer.Com `
  --source-url https://everyayah.com `
  --out assets\recognition-fingerprints.everyayah-abdulsamad.json `
  --cache-dir data\source\audio-cache
```

For a one-ayah network smoke test:

```powershell
node scripts\build-recognition-fingerprint-library.mjs `
  --source-template "https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/{surah3}{ayah3}.mp3" `
  --provider EveryAyah `
  --version AbdulSamad_64kbps_QuranExplorer.Com `
  --source-url https://everyayah.com `
  --out assets\recognition-fingerprints.smoke.json `
  --cache-dir data\source\audio-cache `
  --surah 1 `
  --ayah 1
```

The builder writes SHA-256 hashes for every source audio file and an exact fingerprint for each ayah. It deliberately keeps partial generated libraries out of production readiness. After a full reviewed build, validate with:

```powershell
node scripts\validate-recognition-fingerprint-library.mjs `
  --file assets\recognition-fingerprints.everyayah-abdulsamad.json `
  --require-complete `
  --require-audio-hashes
```

To validate the output from an external recognition engine:

```powershell
node scripts\validate-recognition-result.mjs --file assets\recognition-result.example.json
```

The result validator checks engine identity, surah/ayah range, confidence threshold, optional segment timing, exact-match evidence when required, and the manual-confirmation requirement. Approximate or "closest" Quran matches must not be applied to a project.

To create a handoff job for an external recognition engine:

```powershell
node scripts\create-recognition-job.mjs `
  --audio SOURCE_RECITATION_VIDEO.mp4 `
  --project ayah-studio-project.json `
  --out recognition-job.json `
  --require-segments
```

The job records the media file name, size, SHA-256 hash, optional project context, exact-match requirement, minimum confidence of 1, and required output contract. It does not perform recognition.

To validate a recognition job before handoff:

```powershell
node scripts\validate-recognition-job.mjs `
  --file recognition-job.json `
  --require-source-file
```

This checks the job shape, required output contract, source media existence, and SHA-256 hash when the file is available.

To apply a validated recognition result to an Ayah Studio project:

```powershell
node scripts\apply-recognition-result.mjs `
  --project ayah-studio-project.json `
  --recognition assets\recognition-result.example.json `
  --job recognition-job.json `
  --quran data\quran-uthmani.json `
  --out ayah-studio-project.suggested.json
```

This updates `surah`, `ayahStart`, and `ayahCount` only after exact-match validation. When `--job` is provided, it also verifies that `sourceAudio.sha256` in the result matches the original recognition job. `--quran` is required, must pass `validate-quran-data.mjs --require-reviewed`, and must contain the recognized ayah range. The imported suggestion still clears previous ayah confirmation and must be reviewed manually.

To test the recognition result validator:

```powershell
node scripts\test-recognition-result.mjs
```

To test recognition job creation:

```powershell
node scripts\test-create-recognition-job.mjs
```

To test recognition job validation:

```powershell
node scripts\test-recognition-job.mjs
```

To test applying a recognition result:

```powershell
node scripts\test-apply-recognition-result.mjs
```

To test that Quran data is required before applying a recognition result:

```powershell
node scripts\test-apply-recognition-result-requires-quran.mjs
```

To test that approximate recognition cannot be applied:

```powershell
node scripts\test-apply-recognition-result-rejects-approximate.mjs
```

To test that a result from a different recognition job cannot be applied:

```powershell
node scripts\test-apply-recognition-result-rejects-job-mismatch.mjs
```

To test that a result cannot be applied when the Quran ayah range is missing:

```powershell
node scripts\test-apply-recognition-result-rejects-missing-quran-range.mjs
```

To test that a result cannot be applied with incomplete Quran data:

```powershell
node scripts\test-apply-recognition-result-rejects-incomplete-quran.mjs
```

To guard the exact-match-only policy in the browser app:

```powershell
node scripts\test-recognition-safety-policy.mjs
```

This fails if filename hints or audio timing are changed to update surah/ayah selection automatically.

## Quran Font Manifest Validator

Before final MP4 rendering, document the approved Quran font:

```powershell
node scripts\validate-font-manifest.mjs --file assets\quran-font.example.json
```

To also require the local font file:

```powershell
node scripts\validate-font-manifest.mjs --file assets\quran-font.example.json --require-file
```

The validator checks the font file path, ASS font family name, source URL, license text, and `reviewed/exportReady` flags. Visual Arabic shaping still needs manual QA after rendering.

## Combined Production Validation

Run all local production asset checks together:

```powershell
node scripts\validate-production-assets.mjs
```

With local media/font/recognition model requirements and an MP4 project audit:

```powershell
node scripts\validate-production-assets.mjs `
  --quran-authority data\quran-source-authority.king-fahd.example.json `
  --require-background-files `
  --require-font-file `
  --require-recognition-model `
  --project ayah-studio-project.json `
  --manifest ayah-studio-export-manifest.json `
  --video SOURCE_RECITATION_VIDEO.mp4 `
  --background BACKGROUND_VIDEO_OR_IMAGE.mp4 `
  --font UTHMANI_QURAN_FONT.ttf
```

This command wraps the Quran data, trusted Quran source authority, licensed background catalog, Quran font manifest, recognition engine manifest, and optional MP4 readiness checks into one report.
For Quran data, the combined production validator requires complete ayah coverage, documented source metadata, and `source.reviewed: true`.
For Quran source authority, it requires a documented authority manifest and `authority.reviewed: true`.
When a check fails, the report includes concrete next steps for placing source files, running the preparer/validators, filling reviewed metadata, or passing FFmpeg inputs.

For a machine-readable report:

```powershell
node scripts\validate-production-assets.mjs --json
```

To verify that the readiness report stays actionable while production assets are still missing:

```powershell
node scripts\test-production-readiness-report.mjs
```

To write the current blockers and next steps into a Markdown checklist:

```powershell
node scripts\write-production-checklist.mjs --out production-readiness-checklist.md
```

The checklist writer passes any extra options through to `validate-production-assets.mjs`, so it can be run with the same `--project`, `--manifest`, `--video`, `--background`, `--font`, and `--ffmpeg` inputs.

To test the checklist writer without keeping a generated checklist in the repository:

```powershell
node scripts\test-production-checklist.mjs
```

## Local Test Runner

Run the local syntax and self-test suite:

```powershell
node scripts\test-all.mjs
```

This wraps the app syntax check, production helper syntax checks, Quran source review report syntax, QuranEnc importer syntax, Quran data pipeline test, Quran source authority/import tests, recognition manifest/result/job checks, recognition result application, required-Quran enforcement, approximate-result rejection, recognition-job hash matching, Quran range validation, incomplete-Quran rejection, exact-match safety policy, MP4 dry-run test, FFmpeg discovery test, optional MP4 render smoke test, readiness report test, and checklist test.

## Export Manifest Validator

After downloading the export manifest, validate the handoff shape:

```powershell
node scripts\validate-export-manifest.mjs --file ayah-studio-export-manifest.json
```

The validator checks required input entries, missing-input consistency, backend commands, and export gates.

For a machine-readable manifest report:

```powershell
node scripts\validate-export-manifest.mjs --file ayah-studio-export-manifest.json --json
```
