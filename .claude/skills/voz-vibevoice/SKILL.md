---
name: voz-vibevoice
description: Sintesis de voz local con VibeVoice-Realtime-0.5B — narracion larga y varios hablantes, con voces en espanol. Usala para evaluar la voz de "Don Carlos" o la narracion de los videos de producto, y para medir si el render local es viable antes de pagar ElevenLabs. CONGELADA para produccion - BuildAds sigue congelado; aqui solo se evalua viabilidad y coste.
source: https://github.com/microsoft/VibeVoice
source_commit: 94da20d98b2f
verified: 2026-08-27
---

# VibeVoice — voz para el contenido de campañas

> **Preparada, no autorizada.** BuildAds y ProductAds están congelados por
> `docs/DECISION_ALCANCE_2026-08-13.md`. Esta skill sirve para **evaluar**
> viabilidad y coste, no para generar audio de producción.

## Corrección respecto a la versión del 2026-08-27 (mañana)

La primera versión de esta skill apuntaba a "VibeVoice-TTS" sin ningún comando.
Al volver a la fuente aparecieron dos cosas que la invalidaban:

1. **Microsoft retiró el código de VibeVoice-TTS del repositorio.** Textual del
   `README.md`, entrada del 2025-09-05: *"we have removed the VibeVoice-TTS code
   from this repository."* La razón que da es uso indebido de la herramienta.
2. La skill no traía **ningún** comando. No inventado — ausente. Eso la dejaba
   fuera de la condición 4 de la compuerta.

Lo que sí existe hoy y sí sirve es **VibeVoice-Realtime-0.5B**, liberado el
2025-12-03, con voces multilingües que incluyen **español (ES)**.

## El procedimiento, leído de `docs/vibevoice-realtime-0.5b.md`

Líneas 97-120 del propio repositorio:

```bash
git clone https://github.com/microsoft/VibeVoice.git
cd VibeVoice
pip install -e .[streamingtts]
```

Demo interactivo:

```bash
python demo/vibevoice_realtime_demo.py --model_path microsoft/VibeVoice-Realtime-0.5B
```

Generación desde un archivo de texto, que es el modo que interesa aquí porque
es el que se puede automatizar:

```bash
python demo/realtime_model_inference_from_file.py \
  --model_path microsoft/VibeVoice-Realtime-0.5B \
  --txt_path demo/text_examples/1p_vibevoice.txt \
  --speaker_name Carter
```

`--speaker_name` es el que hay que cambiar por una voz española. Las voces
experimentales multilingües están listadas en el mismo documento, sección
*"Optional: More Experimental Voices"*.

## Lo que hay que medir antes de adoptarla

No son detalles técnicos: son los que deciden si sirve.

- **Cuánto tarda un minuto de audio en esta máquina.** El modelo es de 0.5B y se
  anuncia como *real-time*, pero eso depende del hardware. Si un spot de 30
  segundos tarda cinco minutos, el flujo no es usable.
- **Cómo suena el español mexicano.** El repositorio lista "ES" genérico. Un
  español neutro o peninsular no sirve para una carnicería de San Luis Potosí.
  Hay que oírlo antes, no después.
- **Licencia MIT** — verificada por `gh api repos/microsoft/VibeVoice`. Permite
  uso comercial. Este punto sí está cerrado.

## NO VERIFICADO

No se clonó, no se instaló, no se generó audio. Los comandos salen de
`docs/vibevoice-realtime-0.5b.md` leído el 2026-08-27 vía `gh api`. Los dos
primeros puntos de arriba siguen sin medir, y son la tarea real.
