import { Hono } from 'hono';
import { getOpenAIClient } from '../agent/openai-client.js';
import { assembleCognitiveContext } from '../cognitive/context-assembly.js';
import { planReply } from '../cognitive/reply-planner.js';
import { generateResponse } from '../cognitive/response-generator.js';
import { state } from '../state.js';

const chat = new Hono();

/** POST /api/chat — Send a message and get a response in the trained voice */
chat.post('/', async (c) => {
	if (!state.voiceProfile || !state.soulMd) {
		return c.json(
			{
				error:
					'Voice profile not built yet. Complete the interview and POST /api/interview/build-profile first.',
			},
			400,
		);
	}

	const { message } = await c.req.json<{ message: string }>();
	if (!message) return c.json({ error: 'message required' }, 400);

	const openai = getOpenAIClient();
	const model = 'minimax/minimax-m2.7';

	// Simulacra loop: perceive → context → plan → act
	const context = assembleCognitiveContext(
		state.voiceProfile,
		state.soulMd,
		state.conversationHistory,
		state.corrections,
	);

	const plan = await planReply(context, message, openai, model);
	const response = await generateResponse(plan, context, message, openai, model);

	// Store in episodic memory
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

/** POST /api/chat/feedback — Thumbs down correction */
chat.post('/feedback', async (c) => {
	const { correction } = await c.req.json<{ correction: string }>();
	if (!correction) return c.json({ error: 'correction required' }, 400);

	state.corrections.push(correction);

	return c.json({
		stored: true,
		totalCorrections: state.corrections.length,
	});
});

/** GET /api/chat/history — Get conversation history */
chat.get('/history', async (c) => {
	return c.json({
		history: state.conversationHistory,
		corrections: state.corrections,
	});
});

/** DELETE /api/chat/history — Clear conversation (start fresh) */
chat.delete('/history', async (c) => {
	state.conversationHistory = [];
	return c.json({ cleared: true });
});

export { chat };
