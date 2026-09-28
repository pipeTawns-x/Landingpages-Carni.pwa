# Hero video assets

A trim of `public/img/Videos/VideoCarniwebP01.mp4` for the Landing hero. It keeps seconds 5–15 of the original: the counter, the knife cutting the steak and the grill. It drops seconds 2.5–4.5, where an AI-generated phone shows unreadable text.

| File | Use |
| --- | --- |
| `portada-carne.mp4` | Hero video, H.264, 1280×720, 10 s, no audio, faststart |
| `portada-carne.webm` | Same cut in VP9, smaller; list it first in `<source>` |
| `portada-carne-poster.jpg` / `.webp` | Poster: the frame at 8 s (the knife on the steak), shown before playback and with reduced motion |

The source is 1280 px wide. Full-bleed on a 1440 px retina screen needs about 2880 px, so the hero will look soft until a higher-resolution recording exists.
