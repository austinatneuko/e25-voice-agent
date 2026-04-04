import { Hono } from 'hono';
import { getOpenAIClient } from '../agent/openai-client.js';
import { assembleCognitiveContext } from '../cognitive/context-assembly.js';
import { planReply } from '../cognitive/reply-planner.js';
import { generateResponse } from '../cognitive/response-generator.js';
import { state } from '../state.js';
import { generateSoulMd } from '../voice/soul-generator.js';

const chat = new Hono();

/** Regenerate soul.md incorporating all lessons */
function rebuildSoulWithLessons() {
	if (!state.voiceProfile) return;
	state.soulMd = generateSoulMd(state.voiceProfile, state.lessons);
}

/** POST /api/chat — Send a message and get a response in the trained voice */
chat.post('/', async (c) => {
	if (!state.voiceProfile || !state.soulMd) {
		return c.json(
			{ error: 'Voice profile not built yet.' },
			400,
		);
	}

	const { message } = await c.req.json<{ message: string }>();
	if (!message) return c.json({ error: 'message required' }, 400);

	const openai = getOpenAIClient();
	const model = 'minimax/minimax-m2.7';

	const context = assembleCognitiveContext(
		state.voiceProfile,
		state.soulMd,
		state.conversationHistory,
		state.corrections,
	);

	const plan = await planReply(context, message, openai, model);
	const response = await generateResponse(plan, context, message, openai, model);

	state.conversationHistory.push(
		{ role: 'user', content: message },
		{ role: 'assistant', content: response },
	);

	return c.json({
		response,
		plan: {
			goal: plan.goal,
			socialMove: plan.socialMove,
			toneGuidance: plan.toneGuidance,
		},
	});
});

/** POST /api/chat/feedback — Thumbs down: store correction and regenerate soul */
chat.post('/feedback', async (c) => {
	const { correction } = await c.req.json<{ correction: string }>();
	if (!correction) return c.json({ error: 'correction required' }, 400);

	state.corrections.push(correction);
	state.lessons.push({ type: 'correction', content: correction });

	// Regenerate soul.md with the new lesson incorporated
	rebuildSoulWithLessons();

	return c.json({
		stored: true,
		type: 'correction',
		totalLessons: state.lessons.length,
		soulMd: state.soulMd,
	});
});

/** POST /api/chat/approve — Thumbs up: store good example and regenerate soul */
chat.post('/approve', async (c) => {
	const { message } = await c.req.json<{ message: string }>();
	if (!message) return c.json({ error: 'message required' }, 400);

	state.lessons.push({ type: 'approval', content: message });

	// Regenerate soul.md with the positive example
	rebuildSoulWithLessons();

	return c.json({
		stored: true,
		type: 'approval',
		totalLessons: state.lessons.length,
		soulMd: state.soulMd,
	});
});

/** GET /api/chat/history */
chat.get('/history', async (c) => {
	return c.json({
		history: state.conversationHistory,
		corrections: state.corrections,
		lessons: state.lessons,
	});
});

/** DELETE /api/chat/history */
chat.delete('/history', async (c) => {
	state.conversationHistory = [];
	return c.json({ cleared: true });
});

export { chat };
