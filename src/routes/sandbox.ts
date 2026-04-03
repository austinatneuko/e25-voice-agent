import { Hono } from 'hono';
import { getOpenAIClient } from '../agent/openai-client.js';
import { runCreativeTest } from '../sandbox/creative-test.js';
import { exportVoiceProfile, serializeExport } from '../sandbox/export.js';
import { FeedbackTracker } from '../sandbox/feedback.js';
import { synthesizeReflections } from '../sandbox/reflection-job.js';
import { state } from '../state.js';

const sandbox = new Hono();

// Global feedback tracker
const tracker = new FeedbackTracker();
let lastReflection: { rules: string[]; correctionCount: number; timestamp: string } | null = null;

/** POST /api/sandbox/approve — Mark a response as good (thumbs up) */
sandbox.post('/approve', async (c) => {
	const { messageIndex } = await c.req.json<{ messageIndex: number }>();
	tracker.addApproval(messageIndex ?? state.conversationHistory.length - 1);
	return c.json({ stored: true, stats: tracker.getStats() });
});

/** POST /api/sandbox/correct — Mark a response as wrong (thumbs down + reason) */
sandbox.post('/correct', async (c) => {
	const { correction, messageIndex } = await c.req.json<{
		correction: string;
		messageIndex?: number;
	}>();
	if (!correction) return c.json({ error: 'correction required' }, 400);

	tracker.addCorrection(correction, messageIndex ?? state.conversationHistory.length - 1);
	state.corrections.push(correction);

	// Auto-trigger reflection after every 5 corrections
	const correctionCount = tracker.getCorrectionsForReflection().length;
	if (correctionCount > 0 && correctionCount % 5 === 0) {
		const openai = getOpenAIClient();
		lastReflection = await synthesizeReflections(tracker.getCorrectionsForReflection(), openai);
	}

	return c.json({
		stored: true,
		stats: tracker.getStats(),
		reflectionTriggered: correctionCount > 0 && correctionCount % 5 === 0,
	});
});

/** GET /api/sandbox/stats — Get fidelity stats */
sandbox.get('/stats', async (c) => {
	return c.json({
		...tracker.getStats(),
		lastReflection,
	});
});

/** POST /api/sandbox/reflect — Manually trigger reflection synthesis */
sandbox.post('/reflect', async (c) => {
	const corrections = tracker.getCorrectionsForReflection();
	if (corrections.length === 0) {
		return c.json({ error: 'No corrections to reflect on' }, 400);
	}

	const openai = getOpenAIClient();
	lastReflection = await synthesizeReflections(corrections, openai);

	// Add synthesized rules to corrections (they'll appear in cognitive context)
	for (const rule of lastReflection.rules) {
		if (!state.corrections.includes(rule)) {
			state.corrections.push(rule);
		}
	}

	return c.json(lastReflection);
});

/** POST /api/sandbox/creative-test — Run a creative output test (1NK Step 10) */
sandbox.post('/creative-test', async (c) => {
	if (!state.voiceProfile || !state.soulMd) {
		return c.json({ error: 'Voice profile not built yet' }, 400);
	}

	const body = await c.req
		.json<{ promptIndex?: number }>()
		.catch(() => ({ promptIndex: undefined }));
	const openai = getOpenAIClient();
	const result = await runCreativeTest(
		state.soulMd,
		state.voiceProfile,
		openai,
		'minimax/minimax-m2.7',
		body.promptIndex,
	);

	return c.json(result);
});

/** GET /api/sandbox/export — Export full voice profile as JSON */
sandbox.get('/export', async (c) => {
	if (!state.voiceProfile || !state.soulMd) {
		return c.json({ error: 'Voice profile not built yet' }, 400);
	}

	const exp = exportVoiceProfile(
		state.soulMd,
		state.voiceProfile,
		state.corrections,
		lastReflection,
		tracker.getEntries(),
	);

	c.header('Content-Disposition', 'attachment; filename="voice-profile.json"');
	c.header('Content-Type', 'application/json');
	return c.body(serializeExport(exp));
});

export { sandbox };
