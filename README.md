# Ayah Studio

Ayah Studio is a Web Mobile MVP for preparing respectful Quran reel concepts for the Instagram account `@tilawat_alquran30`.

See `MVP.md` for the MVP scope, technology decision, Quran source policy, font policy, licensing policy, recognition limits, and export handoff decision.

## Current Working Flow

Ayah Studio currently runs as a local Web Mobile Quran video generator. The phone opens the web UI, while the computer runs the local backend, FFmpeg, Quran data, reciter audio downloads, and MP4 generation.

Verified current state:

- Clean background catalog: `818` entries.
- Usable backgrounds after filtering: `783`.
- Inappropriate background audit count: `0`.
- Latest MP4 proof: `outputs/ayah-1-1-2-ar_alafasy-1783168007549.mp4`.
- Latest frame proof: `outputs/ayah-1-1-2-ar_alafasy-1783168007549-frame.png`.
- Proof notes: `GENERATION-PROOF.md`.

Quick commands:

```powershell
npm.cmd test
npm.cmd run audit:backgrounds
npm.cmd run proof:ffmpeg
npm.cmd start
```

Open locally:

```text
http://127.0.0.1:4173/
```

For the connected Android phone used during local testing:

```powershell
adb reverse tcp:4173 tcp:4173
```

Then open the same local URL from Chrome on the phone:

```text
http://127.0.0.1:4173/
```

Increasing Makkah, Madinah, and mosque sources requires one of these environment variables before pressing refresh/import:

```powershell
$env:PIXABAY_API_KEY="..."
$env:PEXELS_API_KEY="..."
```

## Current MVP

- Upload a recitation video and preview it in a 9:16 mobile frame.
- Read recitation video duration and use it to help set ayah timing.
- Run a preliminary in-browser audio analysis to estimate active recitation duration and suggest ayah count.
- Apply light analysis-only audio cleanup before estimating active recitation; the final video audio is not modified.
- Show filename/audio timing hints as non-binding review aids, without changing surah or ayah automatically.
- Switch to explicit manual entry mode when recognition is missing or unreliable.
- Download a human-confirmed recognition feedback JSON file for future matching improvements.
- Validate production recognition-engine metadata before treating audio recognition as ready.
- Create a recognition job JSON for handing real recitation audio/video to an external recognition engine.
- Validate recognition job JSON before handing it to an external engine.
- Validate external recognition result JSON before using it for manual confirmation.
- Apply a validated external recognition result to a project as an unconfirmed review suggestion.
- Confirm surah, starting ayah, and number of ayahs.
- Pick from a small topic preset library that fills surah, starting ayah, and ayah count as reviewable references.
- Require explicit manual confirmation for the currently selected surah, starting ayah, and ayah count before export.
- Set ayah overlay start/end timing for the future video export step.
- Auto-distribute timing across selected ayahs and include the schedule in JSON.
- Display sample Uthmani-style Quran text from an internal demo dataset.
- Show the full 114-surah Quran catalog with official ayah counts for selection.
- Import a trusted Quran JSON dataset for complete ayah text before production export.
- Auto-load `data/quran-uthmani.json` when a reviewed local Quran file is added to the project.
- Persist the imported Quran dataset in browser storage when space allows.
- Show Quran dataset coverage against the 6,236-ayah catalog.
- Validate a local Quran JSON file with `scripts/validate-quran-data.mjs` before using it in production.
- Prepare official Quran source files with `scripts/prepare-quran-data.mjs` before placing the normalized result at `data/quran-uthmani.json`.
- Import and prepare a Quran source in one command with `scripts/import-quran-source.mjs`.
- Fetch complete Uthmani `arabic_text` from QuranEnc API with `scripts/fetch-quranenc-uthmani.mjs`.
- Validate a trusted Quran source authority before import with `scripts/validate-quran-source-authority.mjs`.
- Record the raw source SHA-256 hash in the normalized Quran file for source traceability.
- Auto-prefill Quran source metadata from the normalized file's top-level `source` object.
- Record Quran text source name, URL, edition, and explicit review approval before export.
- Download a Quran source audit JSON report that lists missing surahs and ayahs.
- Show an on-screen Quran audit summary with loaded ayahs, complete surahs, approval status, and first missing surah.
- Choose reciter, riwayah, template, background type, and background clarity.
- Choose from base and seasonal templates, including Ramadan, Jumuah, and last-ten-nights styles.
- Store reciter metadata, riwayah, source, and review status inside the project export.
- Control ayah position, font size, and ayah box opacity.
- Suggest a suitable template/background for the selected ayah.
- Suggest backgrounds with keyword rules for Hajj, prayer, creation, mercy/rizq, night/sky, and historical reminder themes.
- Show a publishing readiness score.
- Show quality warnings for timing, text density, license status, background, and readability.
- Show a final requirements status panel for Quran completeness, recognition, background licensing, and MP4 blockers.
- Show the combined production asset validation command inside the final requirements panel.
- Keep `@tilawat_alquran30` visible in the preview.
- Download a 1080x1920 PNG preview image.
- Download a JSON project plan for the next FFmpeg export phase.
- Download a prototype FFmpeg export plan.
- Download an export manifest that lists required backend input files and missing assets.
- Export manifest now lists Quran data, licensed background catalog, and Quran font manifest as explicit production inputs.
- Includes `scripts/validate-export-manifest.mjs` to check export manifest handoff completeness.
- Export manifest validation can emit a machine-readable JSON report with `--json`.
- Download a three-variant output pack for producing primary, quiet, and seasonal versions of the same recitation.
- Download a batch handoff pack for rendering the same recitation across multiple dawah account profiles.
- FFmpeg plan now includes export gates, required backend inputs, poster command shape, and MP4 command shape.
- Includes `scripts/export-mp4.mjs`, a local FFmpeg backend script that can render MP4 when real inputs are supplied.
- MP4 export now generates a timed ASS subtitle overlay from the ayah schedule for FFmpeg rendering.
- Includes `scripts/test-mp4-export-plan.mjs`, a dry-run self-test for the MP4 command and ASS subtitle generation path.
- Includes `scripts/test-mp4-render-smoke.mjs`, which renders a tiny real MP4 when FFmpeg is installed and otherwise reports a clear skip.
- Includes `scripts/find-ffmpeg.mjs` to discover FFmpeg and confirm subtitles/libass support before MP4 rendering.
- Includes `scripts/audit-readiness.mjs`, a local readiness audit for real MP4 inputs and gates.
- Readiness audit checks that FFmpeg supports the `subtitles` filter needed for ASS ayah overlays.
- Readiness audit can also check reviewed Quran font metadata with `--font-manifest`.
- Includes `scripts/validate-quran-data.mjs`, a local Quran dataset completeness checker.
- Quran data validation can emit a machine-readable JSON report with `--json`.
- Includes `assets/recognition-engine.example.json` and `scripts/validate-recognition-manifest.mjs` for real recognition-engine metadata.
- Includes `scripts/match-quran-transcript.mjs` for exact normalized transcript matching against the reviewed Quran text.
- Adopts local `whisper.cpp` as the preferred free ASR path for transcription before Quran matching.
- Includes `scripts/serve-mobile-backend.mjs` so a phone browser can upload recitation media to the computer running local `whisper.cpp`.
- Includes `assets/recognition-fingerprints.example.json`, `scripts/validate-recognition-fingerprint-library.mjs`, and `scripts/build-recognition-fingerprint-library.mjs` as an optional fingerprint research path, not the main cross-reciter solution.
- Includes `scripts/create-recognition-job.mjs` to package recitation media and project context for an external recognition engine.
- Includes `scripts/validate-recognition-job.mjs` to check source media existence and SHA-256 before recognition handoff.
- Includes `assets/recognition-result.example.json` and `scripts/validate-recognition-result.mjs` for external recognition output validation.
- Includes `scripts/apply-recognition-result.mjs` to import a validated recognition result into a project while clearing manual confirmation.
- Recognition result application requires reviewed local Quran data and verifies the recognized ayah range before updating a project.
- Includes `scripts/mark-quran-source-reviewed.mjs` to mark a Quran source reviewed after human comparison without hand-editing JSON.
- Includes `scripts/test-quran-source-import.mjs`, a local self-test for the one-command Quran source import flow.
- Includes `data/quran-source-authority.king-fahd.example.json` and `scripts/test-quran-source-authority.mjs` for trusted-source authority checks.
- Includes `scripts/test-quran-data-pipeline.mjs`, a local self-test for the Quran source prepare/validate flow without bundling Quran text.
- Includes `assets/quran-font.example.json` and `scripts/validate-font-manifest.mjs` for reviewed Quran font metadata.
- Includes `scripts/validate-production-assets.mjs`, a combined production asset validation command.
- Combined production validation can emit a machine-readable JSON report with `--json`.
- Combined production validation now checks the trusted Quran source authority manifest as a separate production gate.
- Production validation reports next steps for each blocker so Quran data, background licensing, font approval, and MP4 readiness can be fixed in order.
- Includes `scripts/test-production-readiness-report.mjs` to ensure the production readiness report keeps actionable next steps.
- Includes `scripts/write-production-checklist.mjs` to export the current production blockers and next steps as a Markdown checklist.
- Includes `scripts/write-quran-source-review-report.mjs` to generate Quran source review evidence before marking the source reviewed.
- Includes `scripts/test-production-checklist.mjs` to verify the generated readiness checklist contains the expected blockers and commands.
- Includes `scripts/test-all.mjs` as a single local check for syntax, Quran data pipeline, MP4 dry-run, and production readiness helpers.
- Import a previously exported JSON project plan.
- Includes basic PWA files: manifest, icon, and service worker.
- Includes local visual placeholder backgrounds for Makkah, Madinah, masjid, Islamic history, nature, and calm scenes.
- Upload a real image or video background from the device for the preview.
- Track background source, source URL, license type, and no-attribution approval.
- Store internal background metadata, category, source, license, and export-readiness in project JSON and the export manifest.
- Includes `assets/licensed-backgrounds.example.json` as the production catalog shape for reviewed licensed backgrounds.
- Includes `scripts/add-background-catalog-entry.mjs` to add a licensed background file with SHA-256 metadata to a catalog.
- Import a reviewed licensed-background catalog and add export-ready backgrounds to the background picker.
- Show detailed import errors for incomplete licensed-background catalog entries.
- Validate a licensed background catalog with `scripts/validate-background-catalog.mjs` before production import.

## Important Limits

- The built-in Quran text is still a small demo sample. The app now blocks project/poster/FFmpeg export when the selected ayah text is not loaded from the current Quran source.
- Full Quran text is now prepared at `data/quran-uthmani.json` from QuranEnc API `arabic_text`.
- The QuranEnc import passes the 114-surah / 6,236-ayah structural validator, but it is not marked reviewed for production yet.
- Keep the raw official source file under `data/source/`, then run `node scripts\prepare-quran-data.mjs --input data\source\king-fahd-quran-source.json --output data\quran-uthmani.json` to normalize it for the app.
- To refresh the QuranEnc import, run `node scripts\fetch-quranenc-uthmani.mjs`.
- Use `--authority data\quran-source-authority.king-fahd.example.json` with `import-quran-source.mjs` when importing from a King Fahd Complex URL, then mark the authority reviewed only after confirming the exact official download channel.
- Run `node scripts\validate-quran-data.mjs --file data\quran-uthmani.json` after adding the file to check surah/ayah completeness and source metadata.
- Run `node scripts\validate-quran-data.mjs --file data\quran-uthmani.json --require-reviewed` before production export.
- Export actions are blocked until the Quran text source is documented and marked reviewed.
- Large Quran JSON imports depend on available browser storage. If storage is full, the import still works for the current session.
- Audio-based surah and ayah recognition is not production-ready yet; the preferred free path is local `whisper.cpp` transcription followed by exact normalized matching against the reviewed Quran text.
- The audio analysis does not identify surah or ayah; it only helps with duration and ayah-count timing suggestions.
- Recognition job creation is a handoff step for a separate engine; it does not identify the surah or ayah by itself.
- Recognition job validation checks the handoff package only; it still does not certify recognition accuracy.
- Surah and ayah recognition must be exact-match only; approximate or "closest" matches are not acceptable for Quran text.
- The non-manual path starts by transcribing the first 7 seconds of recitation, then expands the analysis window if no unique Quran match is found.
- If transcript matching returns multiple ayah candidates, the app must show those candidates for user choice and must not select automatically.
- Recognition confidence is advisory only and never replaces manual ayah confirmation.
- Even a ready recognition engine must keep manual confirmation required before export.
- Recognition result validation checks structure, ayah range, confidence, timing segments, and the manual-confirmation requirement.
- Applying a recognition result updates the project selection but deliberately clears ayah confirmation so the user must review it.
- Applying a recognition result always requires `--quran`; the Quran file must pass the complete reviewed-data validator, and the selected ayah range must exist in that reviewed data.
- Manual entry mode records that surah and ayah were selected by the user, then still requires explicit confirmation before export.
- Real MP4 export now has an initial local backend script, but it still requires FFmpeg, real source files, reviewed font, and visual QA.
- Run `node scripts\find-ffmpeg.mjs` when MP4 rendering is blocked by FFmpeg availability.
- The MP4 dry-run test proves command/subtitle generation only; it does not render a final video.
- The MP4 smoke test renders a tiny temporary video only when FFmpeg is installed; it is not a production render.
- The FFmpeg script generates an ASS subtitle overlay for ayah timing; final Arabic shaping/wrapping still needs visual QA with the approved font and FFmpeg build.
- The export manifest is a handoff checklist; browser-uploaded video, background, logo, and final font still need real files for backend rendering.
- The font manifest validator checks source/license/review metadata and can optionally require the local font file; it does not certify visual correctness.
- Current visual backgrounds are prototype placeholders, not final licensed real footage.
- Internal background metadata is a review aid; placeholder SVG scenes are still marked as not export-ready for final MP4 production.
- Uploaded custom backgrounds are for local preview; final production still needs license/source review.
- The background catalog validator checks metadata readiness and can optionally require local media files and matching SHA-256 hashes; it does not replace human license review.
- Reciter metadata is a review aid and should be verified before production use.
- Project JSON export is blocked when a custom background has incomplete license approval.
- Project JSON export is blocked when ayah overlay timing is invalid.
- The user must confirm Quran text and ayah selection before export.
- Changing the selected surah, starting ayah, ayah count, or loaded text invalidates the previous ayah confirmation.
- The Quran audit report checks data presence only; it does not replace human review against a trusted Mushaf source.
- The local Quran validator checks structure, counts, source metadata, raw source hash, and obvious placeholder/non-Arabic text; it does not certify textual correctness.
- The combined production validator reports readiness blockers and suggested next steps; it still does not replace Quran text, license, and visual QA review.
- The production readiness report test is expected to pass while the readiness command itself fails until real production assets are added.
- The generated production checklist is a working handoff document; it should be regenerated after adding Quran data, licensed backgrounds, approved font files, or FFmpeg inputs.
- The production checklist test is expected to pass while the checklist writer itself exits not-ready until real production assets are added.
- Run `node scripts\test-all.mjs` as the quick local confidence check before sharing the prototype state.

## Open

Open `index.html` directly in a browser for quick testing.

For browser/PWA behavior, run:

```powershell
node scripts\serve.mjs --port 4173
```

Then open `http://127.0.0.1:4173/`.

For phone-browser testing on the same Wi-Fi, run the local backend:

```powershell
node scripts\serve-mobile-backend.mjs --host 0.0.0.0 --port 4173
```

Then open `http://COMPUTER_LAN_IP:4173/` from the phone. The phone is the web UI; the computer runs FFmpeg and `whisper.cpp`.
