import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes a BuildAds. Intenta de nuevo en un minuto.' }
});

router.use(limiter);

router.post(
  '/predis',
  body('prompt').isString().trim().isLength({ min: 8, max: 400 }),
  body('format').optional().isString().trim().isLength({ min: 3, max: 40 }),
  body('brand_colors').optional().isArray({ min: 1, max: 6 }),
  async (request, response) => {
    const validation = validationResult(request);
    if (!validation.isEmpty()) {
      return response.status(400).json({ error: 'Payload inválido para Predis.', details: validation.array() });
    }

    const { prompt, format, brand_colors: brandColors } = request.body as {
      prompt: string;
      format?: string;
      brand_colors?: string[];
    };

    const apiKey = process.env.PREDIS_API_KEY;

    if (!apiKey) {
      return response.json({
        assets: [
          {
            url: 'img/products/premium.png',
            type: 'image',
            source: 'fallback'
          }
        ],
        fallback: true,
        message: 'Predis no configurado. Se devolvió un asset local para preview.'
      });
    }

    try {
      const upstreamResponse = await fetch('https://brain.predis.ai/predis_api/v1/create_content/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt,
          output_type: format ?? 'carousel',
          brand_guidelines: {
            colors: brandColors ?? ['#DC2626', '#E4D1B0', '#F59E0B']
          }
        })
      });

      if (!upstreamResponse.ok) {
        const upstreamError = await upstreamResponse.text();
        return response.status(upstreamResponse.status).json({ error: 'Predis rechazó la solicitud.', details: upstreamError });
      }

      const payload = (await upstreamResponse.json()) as Record<string, unknown>;
      return response.json(payload);
    } catch (error) {
      return response.status(502).json({
        error: 'No se pudo contactar Predis.',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
);

router.post(
  '/elevenlabs',
  body('text').isString().trim().isLength({ min: 8, max: 400 }),
  body('voice_id').isString().trim().isLength({ min: 3, max: 80 }),
  body('stability').optional().isFloat({ min: 0, max: 1 }),
  async (request, response) => {
    const validation = validationResult(request);
    if (!validation.isEmpty()) {
      return response.status(400).json({ error: 'Payload inválido para ElevenLabs.', details: validation.array() });
    }

    const { text, voice_id: voiceId, stability } = request.body as {
      text: string;
      voice_id: string;
      stability?: number;
    };

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return response.json({
        audio_url: '',
        duration: 15,
        fallback: true,
        message: 'ElevenLabs no configurado. Se devolvió un draft sin audio real.'
      });
    }

    try {
      const upstreamResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          Accept: 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: stability ?? 0.75,
            similarity_boost: 0.7
          }
        })
      });

      if (!upstreamResponse.ok) {
        const upstreamError = await upstreamResponse.text();
        return response.status(upstreamResponse.status).json({ error: 'ElevenLabs rechazó la solicitud.', details: upstreamError });
      }

      const audioBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
      const base64Audio = audioBuffer.toString('base64');

      return response.json({
        audio_url: `data:audio/mpeg;base64,${base64Audio}`,
        duration: 15
      });
    } catch (error) {
      return response.status(502).json({
        error: 'No se pudo contactar ElevenLabs.',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
);

export default router;
