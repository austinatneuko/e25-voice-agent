import { Hono } from 'hono';
import { getOpenAIClient } from '../agent/openai-client.js';
import { extractAntiPatterns } from '../ingestion/anti-pattern-extractor.js';
import { fetchSubstackPosts } from '../ingestion/substack.js';
import type { WritingSample } from '../ingestion/types.js';
import { analyzeStyleMarkers } from '../ingestion/voice-analyzer.js';
import { generateVoiceSummary } from '../ingestion/voice-summarizer.js';
import { fetchTweets } from '../ingestion/x-fetcher.js';
import { state } from '../state.js';

const ingest = new Hono();

/** POST /api/ingest/substack — Ingest from a Substack RSS feed */
ingest.post('/substack', async (c) => {
	const { url } = await c.req.json<{ url: string }>();
	if (!url) return c.json({ error: 'url required' }, 400);

	try {
		const samples = await fetchSubstackPosts(url);
		state.writingSamples.push(...samples);
		return c.json({
			ingested: samples.length,
			totalSamples: state.writingSamples.length,
			titles: samples.map((s) => s.title),
		});
	} catch (e) {
		return c.json({ error: String(e) }, 500);
	}
});

/** POST /api/ingest/x — Ingest tweets from an X handle */
ingest.post('/x', async (c) => {
	const { handle } = await c.req.json<{ handle: string }>();
	if (!handle) return c.json({ error: 'handle required' }, 400);

	const token = process.env.X_BEARER_TOKEN;
	if (!token) return c.json({ error: 'X_BEARER_TOKEN not configured' }, 501);

	try {
		const samples = await fetchTweets(handle, token);
		state.writingSamples.push(...samples);
		return c.json({
			ingested: samples.length,
			totalSamples: state.writingSamples.length,
		});
	} catch (e) {
		return c.json({ error: String(e) }, 500);
	}
});

/** POST /api/ingest/text — Ingest raw text */
ingest.post('/text', async (c) => {
	const { text, title } = await c.req.json<{ text: string; title?: string }>();
	if (!text) return c.json({ error: 'text required' }, 400);

	const sample: WritingSample = { source: 'upload', text, title };
	state.writingSamples.push(sample);

	return c.json({
		ingested: 1,
		totalSamples: state.writingSamples.length,
	});
});

/** POST /api/ingest/analyze — Run voice analysis on all ingested samples */
ingest.post('/analyze', async (c) => {
	if (state.writingSamples.length === 0) {
		return c.json(
			{ error: 'No samples ingested yet. Use /api/ingest/text or /api/ingest/substack first.' },
			400,
		);
	}

	const openai = getOpenAIClient();
	const model = 'minimax/minimax-m2.7';

	// Statistical analysis
	const styleMarkers = analyzeStyleMarkers(state.writingSamples);

	// LLM-powered analysis (parallel)
	const [antiPatterns, voiceSummaryResult] = await Promise.all([
		extractAntiPatterns(state.writingSamples, openai, model),
		generateVoiceSummary(state.writingSamples, styleMarkers, openai, model),
	]);

	// Merge LLM tone scores into style markers
	styleMarkers.tone = voiceSummaryResult.tone;

	state.writingProfile = {
		styleMarkers,
		antiPatterns,
		sampleCount: state.writingSamples.length,
		totalWords: state.writingSamples.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0),
		sources: [...new Set(state.writingSamples.map((s) => s.source))],
		rawSummary: voiceSummaryResult.summary,
	};

	return c.json({
		sampleCount: state.writingProfile.sampleCount,
		totalWords: state.writingProfile.totalWords,
		sources: state.writingProfile.sources,
		summary: voiceSummaryResult.summary,
		antiPatterns: antiPatterns.length,
		styleMarkers: {
			avgSentenceLength: styleMarkers.sentenceLength.avg,
			formality: styleMarkers.tone.formality,
			humor: styleMarkers.tone.humor,
			usesAllLowercase: styleMarkers.formatting.usesAllLowercase,
			signaturePhrases: styleMarkers.vocabulary.signaturePhrases.slice(0, 5),
		},
	});
});

export { ingest };
