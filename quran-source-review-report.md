# Quran Source Review Report

Generated: 2026-06-30T15:00:25.655Z

## Quran Data

- File: `C:\Users\re273\quran\data\quran-uthmani.json`
- Complete: yes
- Loaded ayahs: 6236/6236
- Loaded surahs: 114/114
- Text quality: PASS
- Source metadata: documented
- Source reviewed: yes

## Source

- Name: QuranEnc API
- URL: https://quranenc.com/api/v1/translation/sura/english_saheeh
- Edition: QuranEnc arabic_text via english_saheeh
- Raw source file: C:\Users\re273\quran\data\source\quranenc-uthmani.json
- Recorded raw SHA-256: 0b274b9a34419b69c849e1ba8f1f88606c9d7eb56f301532b64e2e95ad0bcc34
- Current raw SHA-256: 0b274b9a34419b69c849e1ba8f1f88606c9d7eb56f301532b64e2e95ad0bcc34
- Raw hash match: yes

## Authority

- File: `C:\Users\re273\quran\data\quran-source-authority.quranenc.example.json`
- Authority ready: yes
- Authority reviewed: yes

## Review Gate

- This report does not certify Quran text correctness.
- Mark `source.reviewed` only after human comparison against the trusted Mushaf source.
- Keep this report with the reviewer name/date/note used by `mark-quran-source-reviewed.mjs`.

## Commands

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json
node scripts\validate-quran-source-authority.mjs --file data\quran-source-authority.quranenc.example.json --source-url "https://quranenc.com/api/v1/translation/sura/english_saheeh"
node scripts\mark-quran-source-reviewed.mjs --file data\quran-uthmani.json --reviewed-by "Reviewer Name" --review-note "Compared against the trusted Mushaf source."
```
