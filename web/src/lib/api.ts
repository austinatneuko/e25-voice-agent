const BASE = '';

async function post<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	});
	return res.json();
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`);
	return res.json();
}

async function del<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
	return res.json();
}

async function getText(path: string): Promise<string> {
	const res = await fetch(`${BASE}${path}`);
	return res.text();
}

export const api = {
	ingestText: (text: string, title?: string) => post('/api/ingest/text', { text, title }),
	ingestSubstack: (url: string) => post('/api/ingest/substack', { url }),
	ingestX: (handle: string) => post('/api/ingest/x', { handle }),
	analyze: () => post<{
		sampleCount: number;
		totalWords: number;
		summary: string;
		antiPatterns: number;
		styleMarkers: Record<string, unknown>;
	}>('/api/ingest/analyze'),

	interviewStart: () => post<{
		started: boolean;
		nextQuestion: { id: string; question: string; stepName: string; required: boolean } | null;
		progress: { answered: number; total: number; currentStepName: string };
	}>('/api/interview/start'),
	interviewNext: () => get<{
		question: { id: string; question: string; stepName: string; required: boolean } | null;
		progress: { answered: number; total: number; currentStepName: string };
		completed: boolean;
	}>('/api/interview/next'),
	interviewAnswer: (questionId: string, answer: string) =>
		post<{
			recorded: boolean;
			nextQuestion: { id: string; question: string; stepName: string; required: boolean } | null;
			progress: { answered: number; total: number; currentStepName: string };
			completed: boolean;
		}>('/api/interview/answer', { questionId, answer }),
	interviewSkip: (questionId: string) => post('/api/interview/skip', { questionId }),
	interviewSelfEval: () =>
		post<{ sampleResponse: string; question: string }>('/api/interview/self-eval'),
	buildProfile: () =>
		post<{
			built: boolean;
			identity: Record<string, string>;
			antiPatterns: number;
			soulMdPreview: string;
		}>('/api/interview/build-profile'),

	chat: (message: string) =>
		post<{
			response: string;
			plan: { goal: string; socialMove: string; toneGuidance: string };
		}>('/api/chat', { message }),
	feedback: (correction: string) =>
		post<{ stored: boolean; totalCorrections: number }>('/api/chat/feedback', { correction }),
	chatHistory: () =>
		get<{ history: Array<{ role: string; content: string }>; corrections: string[] }>(
			'/api/chat/history',
		),
	clearHistory: () => del('/api/chat/history'),

	profileStatus: () => get<Record<string, unknown>>('/api/profile'),
	soulMd: () => getText('/api/profile/soul'),
};
