import { Hono } from 'hono';
import { state } from '../state.js';

const profile = new Hono();

/** GET /api/profile — Get the current voice profile */
profile.get('/', async (c) => {
	return c.json({
		hasWritingProfile: !!state.writingProfile,
		hasVoiceProfile: !!state.voiceProfile,
		hasSoulMd: !!state.soulMd,
		samplesIngested: state.writingSamples.length,
		interviewAnswers: state.interviewState?.answers.length ?? 0,
		corrections: state.corrections.length,
	});
});

/** GET /api/profile/samples — Preview ingested writing samples */
profile.get('/samples', async (c) => {
	return c.json({
		total: state.writingSamples.length,
		samples: state.writingSamples.map((s) => ({
			source: s.source,
			title: s.title,
			preview: s.text.slice(0, 200) + (s.text.length > 200 ? '...' : ''),
			wordCount: s.text.split(/\s+/).length,
		})),
	});
});

/** GET /api/profile/soul — Get the generated SOUL.md */
profile.get('/soul', async (c) => {
	if (!state.soulMd) {
		return c.json({ error: 'SOUL.md not generated yet' }, 404);
	}
	return c.text(state.soulMd);
});

/** GET /api/profile/writing — Get writing analysis results */
profile.get('/writing', async (c) => {
	if (!state.writingProfile) {
		return c.json({ error: 'No writing analysis yet. POST /api/ingest/analyze first.' }, 404);
	}
	return c.json(state.writingProfile);
});

/** GET /api/profile/full — Get the full merged voice profile */
profile.get('/full', async (c) => {
	if (!state.voiceProfile) {
		return c.json({ error: 'Voice profile not built yet' }, 404);
	}
	return c.json(state.voiceProfile);
});

export { profile };
