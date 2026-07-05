# Quran Data

Place the reviewed Uthmani Quran JSON file here as:

```text
data/quran-uthmani.json
```

Ayah Studio will try to load this file automatically when the app is served through a local web server. The file is not included yet because the Quran text must come from a reviewed, trusted Mushaf source.

## Preferred Source Flow

Use an official King Fahd Glorious Quran Printing Complex / Madinah Mushaf Uthmani Unicode dataset when available. Keep the raw downloaded file under `data/source/` and do not edit Quran text by hand.

Current local data can also be refreshed from QuranEnc API:

```powershell
node scripts\fetch-quranenc-uthmani.mjs
```

That command downloads QuranEnc `arabic_text` for all surahs, writes `data/source/quranenc-uthmani.json`, prepares `data/quran-uthmani.json`, and validates 6,236 ayahs. Human review is still required before setting `source.reviewed` to true.

Prepare the local app file from the reviewed source:

```powershell
node scripts\prepare-quran-data.mjs `
  --input data\source\king-fahd-quran-source.json `
  --output data\quran-uthmani.json `
  --source-name "King Fahd Glorious Quran Printing Complex" `
  --source-url "https://qurancomplex.gov.sa/" `
  --source-edition "Madinah Mushaf Uthmani Unicode dataset"
```

The preparer accepts JSON, CSV, or TXT shaped as `surah|ayah|text`. It also accepts common official dataset fields such as `sora`, `sura_no`, `aya_no`, and `aya_text` without requiring manual edits to the raw Quran file. It only normalizes structure; it does not certify textual correctness.
The generated file includes a top-level `source` object with the source name, URL, edition, raw source path, and SHA-256 hash. Ayah Studio reads that metadata automatically to prefill the Quran source name, URL, edition, and review checkbox.

Use `data/quran-source.king-fahd.example.json` as the review metadata template. Copy it to a real metadata file and fill the exact official download URL, edition/version, reviewer, and review date before production export.

Accepted JSON shapes:

```json
{
  "surahs": [
    {
      "number": 1,
      "name": "الفاتحة",
      "ayahs": [
        { "text": "..." }
      ]
    }
  ]
}
```

or a flat ayah list:

```json
[
  { "surah": 1, "ayah": 1, "text": "..." }
]
```

Official-style flat fields are also accepted:

```json
[
  { "sora": 1, "aya_no": 1, "aya_text": "..." }
]
```

After adding the file, fill in the Quran source fields in the app and mark the source reviewed before export.

Validate the file structure and expected 6,236 ayah coverage before production use:

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json
```

This validator checks surah and ayah coverage, required source metadata including `source.rawSha256`, and basic text quality. The text quality check rejects obvious placeholder/test strings and loaded ayahs without Arabic letters.

For final production readiness, also require the human review flag:

```powershell
node scripts\validate-quran-data.mjs --file data\quran-uthmani.json --require-reviewed
```

After human comparison against the trusted Mushaf source, mark the source reviewed with:

```powershell
node scripts\mark-quran-source-reviewed.mjs `
  --file data\quran-uthmani.json `
  --reviewed-by "Reviewer Name" `
  --review-note "Compared against the official Mushaf source."
```

The validator still does not certify textual correctness. It confirms structure, metadata, and basic non-placeholder text only; human review against the trusted Mushaf source remains required.
