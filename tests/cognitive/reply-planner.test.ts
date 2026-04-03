import { describe, expect, it, vi } from 'vitest';
import type { CognitiveContext } from '../../src/cognitive/context-assembly.js';
import { planReply } from '../../src/cognitive/reply-planner.js';

const mockContext: CognitiveContext = {
	identity: '# SOUL.md\n1NK, hacker',
	reflections: ['CORRECTION: keep responses under 3 sentences'],
	socialModel: null,
	episodicMemory: ['user: hey', 'assistant: yo'],
	planConstraints: {
		antiPatterns: ['No exclamation marks', "Avoid 'Great question!'"],
		toneGuidance: 'Tone: very casual, all lowercase',
		socialMode: 'Guarded, test them first',
	},
};

describe('planReply', () => {
	it('returns parsed plan from LLM response', async () => {
		const mockPlan = JSON.stringify({
			goal: 'Give a brief casual greeting',
			socialMove: 'friendly banter',
			toneGuidance: 'casual, lowercase',
			mustAvoid: ['exclamation marks', 'being too enthusiastic'],
			topicsToMention: [],
		});

		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [{ message: { content: mockPlan } }],
					}),
				},
			},
		};

		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const plan = await planReply(mockContext, 'whats good', mockOpenAI as any);

		expect(plan.goal).toContain('greeting');
		expect(plan.socialMove).toBe('friendly banter');
		expect(plan.mustAvoid).toContain('exclamation marks');
	});

	it('returns fallback plan on malformed LLM response', async () => {
		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [{ message: { content: 'not json' } }],
					}),
				},
			},
		};

		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const plan = await planReply(mockContext, 'hey', mockOpenAI as any);

		expect(plan.goal).toBe('Respond naturally in character');
		expect(plan.mustAvoid.length).toBeGreaterThan(0);
	});

	it('returns fallback plan when LLM returns empty', async () => {
		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [{ message: { content: null } }],
					}),
				},
			},
		};

		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const plan = await planReply(mockContext, 'hey', mockOpenAI as any);

		expect(plan.goal).toBe('Respond naturally in character');
	});
});
