# Crea contenido con Claude (article)

Source URL: https://www.tododeia.com/community/crea-contenido-con-claude

Listed in: [[../index|index]]

## Status

SUCCESS — fetched via `markitdown` directly from the article URL.

## Transcript (article content, condensed — full structure preserved from source)

> Claude no se para frente a la cámara por ti — pero te dice qué investigar, te escribe el guión con tus propias fórmulas y te arma las portadas.

**The 7-stage flow** (with the article's own honesty rating per stage):

1. **Investigación** ⭐⭐⭐⭐⭐ — Claude's strongest stage. You give it your candidate topics; it tells you which are worth your time and which aren't, acting as a judge/filter rather than a search engine. Two modes: "Juez de temas" (ranks topics, honest verdict) and "Dossier de un tema" (deep research package: facts, myths, audience questions, 3 angles, what NOT to say). Explicitly instructs Claude to mark unverifiable facts as "a confirmar" instead of inventing them.
2. **Ideas** ⭐⭐⭐ / ⭐⭐ — weakest stage. Generates ~10 ideas, ~8 of which are obvious. Recommended use: ask for 10 ideas + an honest OBVIA/FRESCA tag on each, or use a one-question-at-a-time interview prompt to extract ideas from the user's own experience.
3. **Guiones** (scripts) ⭐⭐⭐⭐⭐ / ⭐⭐⭐⭐ — Claude + your own formulas/voice produces full drafts; the human "toque que conecta" still has to be added manually.
4. **Grabar** (recording) — 100% human, not automatable.
5. **Imágenes de apoyo** (b-roll) ⭐⭐⭐⭐ — Claude writes the prompt; ChatGPT/Higgsfield execute image/video generation.
6. **Portadas** (thumbnails) ⭐⭐⭐⭐⭐ — same pattern: Claude writes the prompt from your photo + video description; ChatGPT/Higgsfield generate the actual image.
7. **Publicar** — human closes the loop (upload, post).

**Core thesis of the article**: "Claude es el director de orquesta que escribe los prompts; ChatGPT y Higgsfield ejecutan la imagen y el video; y tú pones la cara, el criterio y las ideas frescas. Nadie reemplaza a nadie." (Claude is the conductor that writes the prompts; ChatGPT and Higgsfield execute image/video; you bring the face, judgment, and fresh ideas. No one replaces anyone.)

## 5-line actionable summary — what to apply to Carni-mvp

1. Use the "Juez de temas" / research-dossier prompt pattern for BuildAds' AI-generated campaign copy: have Groq (or Claude) rank proposed campaign angles honestly before generating creative, instead of generating blindly.
2. Apply the "mark unverifiable as 'a confirmar', never invent" discipline directly to BuildAds copy generation — this matches the project's own DO NOT FABRICATE rule and should be encoded into the BuildAds prompt templates.
3. Treat AI-generated ad ideas (BuildAds Step 4 strategy preview) the way the article treats "Ideas" stage — expect ~80% generic output, and keep [[../glossary#hitl|HITL]] review focused on filtering for the non-obvious 20%, not rubber-stamping the list.
4. For "Don Carlos" voice content and BuildAds creative copy, use this same conductor pattern: Claude/Groq writes the prompt/script, ElevenLabs/Predis execute the actual asset — never let the LLM try to directly produce final media.
5. The "100% tú" stage (recording) maps to the irreducible human step in Carni-mvp: a butcher/owner's real voice, face, and judgment calls (e.g. final campaign Authorize click) are not delegable to AI — reinforces the existing HITL authorize loop design in [[../vision#buildads--6-step-wizard|vision]].
