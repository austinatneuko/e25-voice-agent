const BASE = '';

async function post<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error?: string }).error || res.statusText);
	}
	return res.json();
}

async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`);
	if (!res.ok) throw new Error(res.statusText);
	return res.json();
}

async function del<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
	return res.json();
}

async function getText(path: string): Promise<string> {
	const res = await fetch(`${BASE}${path}`);
	if (!res.ok) return '';
	return res.text();
}

export interface IngestResult {
	ingested: number;
	totalSamples: number;
	titles?: string[];
}

export interface SamplePreview {
	source: string;
	title?: string;
	preview: string;
	wordCount: number;
}

export interface AnalysisResult {
	sampleCount: number;
	totalWords: number;
	summary: string;
	antiPatterns: number;
	styleMarkers: {
		avgSentenceLength: number;
		formality: number;
		humor: number;
		usesAllLowercase: boolean;
		signaturePhrases: string[];
	};
}

export interface InterviewQuestion {
	id: string;
	question: string;
	stepName: string;
	required: boolean;
}

export interface InterviewProgress {
	answered: number;
	total: number;
	currentStepName: string;
}

export interface InterviewResponse {
	nextQuestion: InterviewQuestion | null;
	progress: InterviewProgress;
	completed: boolean;
}

export interface ChatResponse {
	response: string;
	plan: { goal: string; socialMove: string; toneGuidance: string };
}

export const api = {
	ingestText: (text: string, title?: string) =>
		post<IngestResult>('/api/ingest/text', { text, title }),
	ingestSubstack: (url: string) =>
		post<IngestResult>('/api/ingest/substack', { url }),
	ingestX: (handle: string) =>
		post<IngestResult>('/api/ingest/x', { handle }),
	analyze: () => post<AnalysisResult>('/api/ingest/analyze'),

	getSamples: () => get<{ total: number; samples: SamplePreview[] }>('/api/profile/samples'),

	interviewStart: () =>
		post<{ started: boolean } & InterviewResponse>('/api/interview/start'),
	interviewNext: () =>
		get<{ question: InterviewQuestion | null } & InterviewResponse>('/api/interview/next'),
	interviewAnswer: (questionId: string, answer: string) =>
		post<{ recorded: boolean } & InterviewResponse>('/api/interview/answer', {
			questionId,
			answer,
		}),
	interviewSkip: (questionId: string) => post('/api/interview/skip', { questionId }),
	buildProfile: () =>
		post<{
			built: boolean;
			identity: Record<string, string>;
			antiPatterns: number;
			soulMdPreview: string;
		}>('/api/interview/build-profile'),

	chat: (message: string) => post<ChatResponse>('/api/chat', { message }),
	feedback: (correction: string) =>
		post<{ stored: boolean; totalCorrections: number }>('/api/chat/feedback', { correction }),
	clearHistory: () => del('/api/chat/history'),

	soulMd: () => getText('/api/profile/soul'),
};
