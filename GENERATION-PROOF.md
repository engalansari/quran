# Ayah Studio Generation Proof

Date: 2026-07-04

## Latest Verified Output

- Output: `outputs/ayah-1-1-2-ar_alafasy-1783171672583.mp4`
- Frame proof: `outputs/ayah-1-1-2-ar_alafasy-1783171672583-frame.png`
- Surah: Al-Fatihah
- Ayahs: 1-2
- Reciter: Mishari Rashid Alafasy
- Background: `pixabay-198048-makkah-haram`
- Duration: 11.391837 seconds audio / 11.366667 seconds video stream
- Video: 1080x1920, 30 fps
- Audio: AAC, stereo, 44100 Hz

## Result

The local API `/api/compose-selected-video` returned `ready: true` and produced an MP4 file with:

- Real Makkah background video.
- Quran text rendered over the background.
- `@tilawat_alquran30` visible.
- Audio stream present.
- Vertical 9:16 output.

## Notes

- The generic `scripts/find-ffmpeg.mjs` check does not find FFmpeg on PATH.
- The generator still works because the backend uses the bundled FFmpeg at `tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe`.
