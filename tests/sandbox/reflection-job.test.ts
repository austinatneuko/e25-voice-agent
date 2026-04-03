import { describe, expect, it, vi } from 'vitest';
import { synthesizeReflections } from '../../src/sandbox/reflection-job.js';

describe('synthesizeReflections', () => {
	it('synthesizes corrections into rules', async () => {
		const mockRules = JSON.stringify([
			'Never use exclamation marks',
			'Keep sentences under 10 words',
			'Avoid formal vocabulary like "utilize" or "furthermore"',
		]);

		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [{ message: { content: mockRules } }],
					}),
				},
			},
		};

		const corrections = [
			'too many exclamation marks',
			'sentences are too long',
			'used the word utilize',
			'sounds too formal',
			'said furthermore which I never say',
		];

		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const result = await synthesizeReflections(corrections, mockOpenAI as any);

		expect(result.rules).toHaveLength(3);
		expect(result.correctionCount).toBe(5);
		expect(result.rules[0]).toContain('exclamation');
	});

	it('returns empty rules on no corrections', async () => {
		const mockOpenAI = { chat: { completions: { create: vi.fn() } } };
		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const result = await synthesizeReflections([], mockOpenAI as any);
		expect(result.rules).toEqual([]);
		expect(result.correctionCount).toBe(0);
	});

	it('handles malformed LLM response', async () => {
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
		const result = await synthesizeReflections(['fix this'], mockOpenAI as any);
		expect(result.rules).toEqual([]);
		expect(result.correctionCount).toBe(1);
	});
});
