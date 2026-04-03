import { Hono } from 'hono';
import { getOpenAIClient } from '../agent/openai-client.js';
import {
	createInterviewState,
	generateSelfEval,
	getNextQuestion,
	getProgress,
	recordAnswer,
	skipQuestion,
} from '../interview/engine.js';
import { state } from '../state.js';
import { buildVoiceProfile } from '../voice/profile-builder.js';
import { generateSoulMd } from '../voice/soul-generator.js';

const interview = new Hono();

/** Rebuild soul.md from current state (called after each answer) */
function rebuildSoul() {
	if (!state.interviewState || state.interviewState.answers.length === 0) return;
	state.voiceProfile = buildVoiceProfile(state.writingProfile, state.interviewState.answers);
	state.soulMd = generateSoulMd(state.voiceProfile);
}

/** POST /api/interview/start — Begin the interview */
interview.post('/start', async (c) => {
	state.interviewState = createInterviewState(state.writingProfile ?? undefined);

	// If we have a writing profile, build initial soul from it
	if (state.writingProfile) {
		state.voiceProfile = buildVoiceProfile(state.writingProfile, []);
		state.soulMd = generateSoulMd(state.voiceProfile);
	}

	const next = getNextQuestion(state.interviewState);
	const progress = getProgress(state.interviewState);

	return c.json({
		started: true,
		nextQuestion: next,
		progress,
		soulMd: state.soulMd,
	});
});

/** GET /api/interview/next — Get the next question */
interview.get('/next', async (c) => {
	if (!state.interviewState) {
		return c.json({ error: 'Interview not started. POST /api/interview/start first.' }, 400);
	}

	const next = getNextQuestion(state.interviewState);
	const progress = getProgress(state.interviewState);

	return c.json({
		question: next,
		nextQuestion: next,
		progress,
		completed: state.interviewState.completed,
	});
});

/** POST /api/interview/answer — Submit an answer, rebuild soul incrementally */
interview.post('/answer', async (c) => {
	if (!state.interviewState) {
		return c.json({ error: 'Interview not started' }, 400);
	}

	const { questionId, answer } = await c.req.json<{ questionId: string; answer: string }>();
	if (!questionId || !answer) return c.json({ error: 'questionId and answer required' }, 400);

	try {
		state.interviewState = recordAnswer(state.interviewState, questionId, answer);
	} catch (e) {
		return c.json({ error: String(e) }, 400);
	}

	// Rebuild soul after every answer so it updates live
	rebuildSoul();

	const next = getNextQuestion(state.interviewState);
	const progress = getProgress(state.interviewState);

	return c.json({
		recorded: true,
		nextQuestion: next,
		progress,
		completed: state.interviewState.completed,
		soulMd: state.soulMd,
	});
});

/** POST /api/interview/skip — Skip a question */
interview.post('/skip', async (c) => {
	if (!state.interviewState) {
		return c.json({ error: 'Interview not started' }, 400);
	}

	const { questionId } = await c.req.json<{ questionId: string }>();
	if (!questionId) return c.json({ error: 'questionId required' }, 400);

	state.interviewState = skipQuestion(state.interviewState, questionId);
	const next = getNextQuestion(state.interviewState);
	const progress = getProgress(state.interviewState);

	return c.json({
		skipped: true,
		nextQuestion: next,
		progress,
		completed: state.interviewState.completed,
	});
});

/** POST /api/interview/self-eval — Generate a self-evaluation sample */
interview.post('/self-eval', async (c) => {
	if (!state.interviewState || state.interviewState.answers.length < 3) {
		return c.json({ error: 'Need at least 3 answers before self-eval' }, 400);
	}

	const openai = getOpenAIClient();
	const result = await generateSelfEval(
		state.interviewState.answers,
		openai,
		'minimax/minimax-m2.7',
	);

	return c.json(result);
});

/** POST /api/interview/build-profile — Build voice profile from interview + writing */
interview.post('/build-profile', async (c) => {
	rebuildSoul();

	if (!state.voiceProfile || !state.soulMd) {
		// Build from writing profile alone if no interview answers
		if (state.writingProfile) {
			state.voiceProfile = buildVoiceProfile(state.writingProfile, []);
			state.soulMd = generateSoulMd(state.voiceProfile);
		} else {
			return c.json({ error: 'No data to build profile from' }, 400);
		}
	}

	return c.json({
		built: true,
		identity: state.voiceProfile.identity,
		antiPatterns: state.voiceProfile.antiPatterns.length,
		hasSocialModes: !!state.voiceProfile.socialModes,
		personalityKeys: Object.keys(state.voiceProfile.personality),
		soulMd: state.soulMd,
	});
});

export { interview };
