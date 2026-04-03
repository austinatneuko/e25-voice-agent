import { describe, expect, it } from 'vitest';
import type { VoiceProfile } from '../../src/ingestion/types.js';
import type { InterviewAnswer } from '../../src/interview/engine.js';
import { buildVoiceProfile } from '../../src/voice/profile-builder.js';
import { generateSoulMd } from '../../src/voice/soul-generator.js';

const mockWritingProfile: VoiceProfile = {
	styleMarkers: {
		sentenceLength: { avg: 7, short: 75, medium: 20, long: 5 },
		vocabulary: {
			avgWordLength: 4,
			uniqueWordRatio: 0.65,
			signaturePhrases: ['ship it', 'no way'],
		},
		tone: { formality: 0.15, humor: 0.7, sarcasm: 0.6, warmth: 0.3 },
		formatting: {
			usesEmoji: false,
			usesAllLowercase: true,
			usesAllCaps: false,
			avgParagraphLength: 12,
			usesPunctuation: { exclamation: 2, question: 8, ellipsis: 20, dash: 5 },
		},
		topics: ['crypto', 'hacking'],
	},
	antiPatterns: [
		{
			pattern: "Don't use exclamation marks",
			reason: 'Never uses them',
			example: 'Great question!',
		},
		{ pattern: "Avoid 'it's not X, it's Y' structure", reason: 'Chatbot cadence' },
	],
	sampleCount: 20,
	totalWords: 800,
	sources: ['x'],
	rawSummary: 'Terse, lowercase, cypherpunk energy.',
};

const mockAnswers: InterviewAnswer[] = [
	{
		questionId: 'identity-who',
		question: 'Who are you?',
		answer: '1NK, 23, hacker',
		step: 1,
		stepName: 'identity',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'identity-role',
		question: 'Role?',
		answer: 'Leader of the BLOC',
		step: 1,
		stepName: 'identity',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-strangers',
		question: 'Strangers?',
		answer: 'Guarded then warm',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-friends',
		question: 'Friends?',
		answer: 'Chatroom buddy energy',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-conflict',
		question: 'Conflict?',
		answer: 'Roast them',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'personality-music',
		question: 'Music?',
		answer: 'aphex twin, boards of canada',
		step: 5,
		stepName: 'personality',
		timestamp: '2026-04-03T00:00:00Z',
	},
];

describe('generateSoulMd', () => {
	it('generates a valid SOUL.md with all sections', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		expect(soul).toContain('# SOUL.md');
		expect(soul).toContain('1NK, 23, hacker');
		expect(soul).toContain('Leader of the BLOC');
	});

	it('includes voice rules from style markers', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		expect(soul).toContain('## Voice Rules');
		expect(soul).toContain('all lowercase');
		expect(soul).toContain('short');
		expect(soul).toContain('No emojis');
	});

	it('includes anti-patterns section', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		expect(soul).toContain('## NEVER Do This');
		expect(soul).toContain('exclamation');
		expect(soul).toContain('Great question!');
	});

	it('includes social modes', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		expect(soul).toContain('## Social Modes');
		expect(soul).toContain('Guarded');
		expect(soul).toContain('Roast');
	});

	it('includes personality section', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		expect(soul).toContain('## Personality');
		expect(soul).toContain('aphex twin');
	});

	it('is lean — no excessive verbosity', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		const soul = generateSoulMd(profile);

		// 1NK principle: keep the soul file lean
		const lines = soul.split('\n').filter((l) => l.trim().length > 0);
		expect(lines.length).toBeLessThan(60);
	});
});
