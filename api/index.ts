import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';

export const config = {
	runtime: 'nodejs',
	maxDuration: 30,
};

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		version: '0.1.0',
		openrouter: !!process.env.OPENROUTER_API_KEY,
		xApi: !!process.env.X_BEARER_TOKEN,
	});
});

app.get('/api/profile', async (c) => {
	const { state } = await import('../src/state.js');
	return c.json({
		hasWritingProfile: !!state.writingProfile,
		hasVoiceProfile: !!state.voiceProfile,
		hasSoulMd: !!state.soulMd,
		samplesIngested: state.writingSamples.length,
		corrections: state.corrections.length,
	});
});

app.post('/api/ingest/text', async (c) => {
	const { state } = await import('../src/state.js');
	const { text, title } = await c.req.json();
	if (!text) return c.json({ error: 'text required' }, 400);
	state.writingSamples.push({ source: 'upload', text, title });
	return c.json({ ingested: 1, totalSamples: state.writingSamples.length });
});

app.post('/api/ingest/analyze', async (c) => {
	const { state } = await import('../src/state.js');
	const { analyzeStyleMarkers } = await import('../src/ingestion/voice-analyzer.js');
	const { extractAntiPatterns } = await import('../src/ingestion/anti-pattern-extractor.js');
	const { generateVoiceSummary } = await import('../src/ingestion/voice-summarizer.js');
	const { getOpenAIClient } = await import('../src/agent/openai-client.js');

	if (state.writingSamples.length === 0) {
		return c.json({ error: 'No samples ingested yet' }, 400);
	}

	const openai = getOpenAIClient();
	const model = 'minimax/minimax-m2.7';
	const styleMarkers = analyzeStyleMarkers(state.writingSamples);
	const [antiPatterns, voiceSummaryResult] = await Promise.all([
		extractAntiPatterns(state.writingSamples, openai, model),
		generateVoiceSummary(state.writingSamples, styleMarkers, openai, model),
	]);
	styleMarkers.tone = voiceSummaryResult.tone;
	state.writingProfile = {
		styleMarkers,
		antiPatterns,
		sampleCount: state.writingSamples.length,
		totalWords: state.writingSamples.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0),
		sources: [...new Set(state.writingSamples.map((s) => s.source))],
		rawSummary: voiceSummaryResult.summary,
	};
	return c.json({ summary: voiceSummaryResult.summary, antiPatterns: antiPatterns.length });
});

// Lazy-load full routes for interview, chat, sandbox
app.all('/api/interview/*', async (c) => {
	const { interview } = await import('../src/routes/interview.js');
	const sub = new Hono();
	sub.route('/api/interview', interview);
	return sub.fetch(c.req.raw);
});

app.all('/api/chat/*', async (c) => {
	const { chat } = await import('../src/routes/chat.js');
	const sub = new Hono();
	sub.route('/api/chat', chat);
	return sub.fetch(c.req.raw);
});

app.post('/api/chat', async (c) => {
	const { chat } = await import('../src/routes/chat.js');
	const sub = new Hono();
	sub.route('/api/chat', chat);
	return sub.fetch(c.req.raw);
});

app.all('/api/sandbox/*', async (c) => {
	const { sandbox } = await import('../src/routes/sandbox.js');
	const sub = new Hono();
	sub.route('/api/sandbox', sandbox);
	return sub.fetch(c.req.raw);
});

app.get('/api/profile/*', async (c) => {
	const { profile } = await import('../src/routes/profile.js');
	const sub = new Hono();
	sub.route('/api/profile', profile);
	return sub.fetch(c.req.raw);
});

export default handle(app);
