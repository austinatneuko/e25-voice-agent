import { Hono } from 'hono';

const voice = new Hono();

/** POST /api/voice/tts — Text-to-speech via ElevenLabs */
voice.post('/tts', async (c) => {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) return c.json({ error: 'ELEVENLABS_API_KEY not configured' }, 501);

	const { text, voiceId } = await c.req.json<{ text: string; voiceId?: string }>();
	if (!text) return c.json({ error: 'text required' }, 400);

	// Default to "Rachel" voice, a natural conversational voice
	const vid = voiceId || '21m00Tcm4TlvDq8ikWAM';

	const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
		method: 'POST',
		headers: {
			'xi-api-key': apiKey,
			'Content-Type': 'application/json',
			Accept: 'audio/mpeg',
		},
		body: JSON.stringify({
			text,
			model_id: 'eleven_turbo_v2_5',
			voice_settings: { stability: 0.5, similarity_boost: 0.75 },
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		return c.json({ error: `ElevenLabs error: ${res.status} ${err}` }, 502);
	}

	const audio = await res.arrayBuffer();
	c.header('Content-Type', 'audio/mpeg');
	return c.body(audio);
});

/** GET /api/voice/voices — List available ElevenLabs voices */
voice.get('/voices', async (c) => {
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) return c.json({ error: 'ELEVENLABS_API_KEY not configured' }, 501);

	const res = await fetch('https://api.elevenlabs.io/v1/voices', {
		headers: { 'xi-api-key': apiKey },
	});

	if (!res.ok) return c.json({ error: 'Failed to fetch voices' }, 502);

	const data = (await res.json()) as { voices: Array<{ voice_id: string; name: string }> };
	return c.json({
		voices: data.voices.map((v) => ({ id: v.voice_id, name: v.name })),
	});
});

export { voice };
