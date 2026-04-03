import { describe, expect, it } from 'vitest';
import { assembleCognitiveContext } from '../../src/cognitive/context-assembly.js';
import type { FullVoiceProfile } from '../../src/voice/types.js';

const mockProfile: FullVoiceProfile = {
	identity: { name: '1NK', role: 'hacker', mission: 'expose corruption', vibe: 'cypherpunk' },
	styleMarkers: {
		sentenceLength: { avg: 7, short: 75, medium: 20, long: 5 },
		vocabulary: { avgWordLength: 4, uniqueWordRatio: 0.65, signaturePhrases: [] },
		tone: { formality: 0.15, humor: 0.6, sarcasm: 0.4, warmth: 0.3 },
		formatting: {
			usesEmoji: false,
			usesAllLowercase: true,
			usesAllCaps: false,
			avgParagraphLength: 12,
			usesPunctuation: { exclamation: 2, question: 8, ellipsis: 15, dash: 5 },
		},
		topics: ['crypto'],
	},
	socialModes: {
		strangers: 'Guarded, test them first',
		friends: 'Chatroom buddy energy',
		conflict: 'Roast them',
	},
	antiPatterns: [
		{ pattern: 'No exclamation marks', reason: 'not the vibe' },
		{ pattern: "Avoid 'Great question!'", reason: 'chatbot cadence' },
	],
	personality: { music: 'aphex twin' },
	updatedAt: '2026-04-03T00:00:00Z',
};

const soulMd = '# SOUL.md\n1NK, hacker, cypherpunk energy';

describe('assembleCognitiveContext', () => {
	it('assembles all sections from profile', () => {
		const ctx = assembleCognitiveContext(mockProfile, soulMd, [], []);

		expect(ctx.identity).toBe(soulMd);
		expect(ctx.planConstraints.antiPatterns).toContain('No exclamation marks');
		expect(ctx.planConstraints.toneGuidance).toContain('casual');
		expect(ctx.reflections).toHaveLength(0);
		expect(ctx.episodicMemory).toHaveLength(0);
	});

	it('includes corrections as reflections', () => {
		const corrections = ["Don't over-explain technical concepts", 'Keep it shorter'];
		const ctx = assembleCognitiveContext(mockProfile, soulMd, [], corrections);

		expect(ctx.reflections).toHaveLength(2);
		expect(ctx.reflections[0]).toContain('CORRECTION');
		expect(ctx.reflections[0]).toContain('over-explain');
	});

	it('includes conversation history as episodic memory', () => {
		const history = [
			{ role: 'user', content: 'hey' },
			{ role: 'assistant', content: 'yo' },
			{ role: 'user', content: 'whats up' },
		];
		const ctx = assembleCognitiveContext(mockProfile, soulMd, history, []);

		expect(ctx.episodicMemory).toHaveLength(3);
		expect(ctx.episodicMemory[0]).toBe('user: hey');
	});

	it('limits episodic memory to last 10 turns', () => {
		const history = Array.from({ length: 20 }, (_, i) => ({
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `message ${i}`,
		}));
		const ctx = assembleCognitiveContext(mockProfile, soulMd, history, []);

		expect(ctx.episodicMemory).toHaveLength(10);
	});

	it('uses strangers social mode for new conversations', () => {
		const ctx = assembleCognitiveContext(mockProfile, soulMd, [], []);
		expect(ctx.planConstraints.socialMode).toContain('Guarded');
	});

	it('uses friends social mode for longer conversations', () => {
		const history = Array.from({ length: 8 }, (_, i) => ({
			role: i % 2 === 0 ? 'user' : 'assistant',
			content: `msg ${i}`,
		}));
		const ctx = assembleCognitiveContext(mockProfile, soulMd, history, []);
		expect(ctx.planConstraints.socialMode).toContain('buddy');
	});

	it('derives tone guidance from style markers', () => {
		const ctx = assembleCognitiveContext(mockProfile, soulMd, [], []);
		expect(ctx.planConstraints.toneGuidance).toContain('casual');
		expect(ctx.planConstraints.toneGuidance).toContain('lowercase');
	});
});
