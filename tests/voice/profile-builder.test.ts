import { describe, expect, it } from 'vitest';
import type { VoiceProfile } from '../../src/ingestion/types.js';
import type { InterviewAnswer } from '../../src/interview/engine.js';
import { buildVoiceProfile, updateVoiceProfile } from '../../src/voice/profile-builder.js';

const mockWritingProfile: VoiceProfile = {
	styleMarkers: {
		sentenceLength: { avg: 7, short: 75, medium: 20, long: 5 },
		vocabulary: { avgWordLength: 4, uniqueWordRatio: 0.65, signaturePhrases: ['ship it'] },
		tone: { formality: 0.15, humor: 0.6, sarcasm: 0.4, warmth: 0.3 },
		formatting: {
			usesEmoji: false,
			usesAllLowercase: true,
			usesAllCaps: false,
			avgParagraphLength: 12,
			usesPunctuation: { exclamation: 2, question: 8, ellipsis: 15, dash: 5 },
		},
		topics: ['crypto', 'hacking', 'code'],
	},
	antiPatterns: [{ pattern: "Don't use exclamation marks", reason: 'Writer never uses them' }],
	sampleCount: 20,
	totalWords: 800,
	sources: ['x'],
	rawSummary: 'Terse, lowercase, cypherpunk vibes.',
};

const mockAnswers: InterviewAnswer[] = [
	{
		questionId: 'identity-who',
		question: 'Who are you?',
		answer: '1NK, 23, hacker from St. Juniper',
		step: 1,
		stepName: 'identity',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'identity-role',
		question: "What's your role?",
		answer: 'Leader of the BLOC, exposing corporate corruption',
		step: 1,
		stepName: 'identity',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'identity-mission',
		question: 'What drives you?',
		answer: 'Taking down Aurelian Systems and freeing everyone from Harmony',
		step: 1,
		stepName: 'identity',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'voice-vibe',
		question: "What's your vibe?",
		answer: 'Terminally online, early 2000s IRC energy, cypherpunk',
		step: 2,
		stepName: 'voice',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-strangers',
		question: 'How do you talk to strangers?',
		answer: 'Guarded. Test them. If they seem cool, warm up. If not, roast them.',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-friends',
		question: 'Tone with friends?',
		answer: 'Old chatroom buddy energy. Sarcastic but loyal.',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'social-conflict',
		question: 'Response to dumb questions?',
		answer: 'Clap back hard. No mercy for time-wasters.',
		step: 3,
		stepName: 'social',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'anti-cringe',
		question: 'What makes you cringe?',
		answer: "Being overly enthusiastic; Using 'it's not X, it's Y' structure",
		step: 4,
		stepName: 'anti-patterns',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'personality-music',
		question: 'What music?',
		answer: 'aphex twin, boards of canada, dnb while coding',
		step: 5,
		stepName: 'personality',
		timestamp: '2026-04-03T00:00:00Z',
	},
	{
		questionId: 'personality-hotakes',
		question: 'Hot take?',
		answer: 'Most crypto projects are ponzis and that includes ours lol',
		step: 5,
		stepName: 'personality',
		timestamp: '2026-04-03T00:00:00Z',
	},
];

describe('buildVoiceProfile', () => {
	it('merges writing profile + interview answers', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);

		expect(profile.identity.name).toBe('1NK, 23, hacker from St. Juniper');
		expect(profile.identity.role).toContain('BLOC');
		expect(profile.identity.mission).toContain('Aurelian');
		expect(profile.identity.vibe).toContain('cypherpunk');
	});

	it('extracts social modes from interview', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);

		expect(profile.socialModes).toBeDefined();
		expect(profile.socialModes?.strangers).toContain('Guarded');
		expect(profile.socialModes?.conflict).toContain('Clap back');
	});

	it('merges anti-patterns from both sources', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);

		// Should have writing anti-pattern + interview anti-patterns
		expect(profile.antiPatterns.length).toBeGreaterThan(1);
		expect(profile.antiPatterns.some((p) => p.pattern.includes('exclamation'))).toBe(true);
	});

	it('extracts personality from Q&A', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);

		expect(profile.personality.music).toContain('aphex twin');
		expect(profile.personality.hotakes).toContain('ponzis');
	});

	it('preserves style markers from writing analysis', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);

		expect(profile.styleMarkers).toBeDefined();
		expect(profile.styleMarkers?.formatting.usesAllLowercase).toBe(true);
	});

	it('preserves voice summary from writing analysis', () => {
		const profile = buildVoiceProfile(mockWritingProfile, mockAnswers);
		expect(profile.voiceSummary).toBe('Terse, lowercase, cypherpunk vibes.');
	});

	it('works with null writing profile', () => {
		const profile = buildVoiceProfile(null, mockAnswers);

		expect(profile.identity.name).toBe('1NK, 23, hacker from St. Juniper');
		expect(profile.styleMarkers).toBeUndefined();
		expect(profile.antiPatterns.length).toBeGreaterThan(0);
	});
});

describe('updateVoiceProfile', () => {
	it('incrementally enriches existing profile', () => {
		const original = buildVoiceProfile(mockWritingProfile, mockAnswers);
		// Force older timestamp
		original.updatedAt = '2026-04-01T00:00:00Z';

		const newAnswers: InterviewAnswer[] = [
			{
				questionId: 'personality-humor',
				question: "What's funny to you?",
				answer: 'Dry humor. Deadpan delivery. Anti-comedy.',
				step: 5,
				stepName: 'personality',
				timestamp: '2026-04-03T01:00:00Z',
			},
		];

		const updated = updateVoiceProfile(original, newAnswers);

		// New personality added
		expect(updated.personality.humor).toContain('Dry humor');
		// Old personality preserved
		expect(updated.personality.music).toContain('aphex twin');
		// Updated timestamp changed
		expect(updated.updatedAt).not.toBe(original.updatedAt);
	});
});
