import { describe, expect, it, vi } from 'vitest';
import { extractAntiPatterns } from '../../src/ingestion/anti-pattern-extractor.js';
import type { WritingSample } from '../../src/ingestion/types.js';

describe('extractAntiPatterns', () => {
	const samples: WritingSample[] = [
		{ source: 'x', text: 'lol this is wild. cant believe they shipped that.' },
		{ source: 'x', text: 'just deployed the thing. works fine. ship it.' },
	];

	it('returns parsed anti-patterns from LLM response', async () => {
		const mockResponse = JSON.stringify([
			{
				pattern: "Don't use exclamation marks",
				reason: 'Writer never uses them',
				example: 'Great question!',
			},
			{
				pattern: "Don't capitalize sentences",
				reason: 'Writer uses all lowercase',
			},
		]);

		const mockOpenAI = {
			chat: {
				completions: {
					create: vi.fn().mockResolvedValue({
						choices: [{ message: { content: mockResponse } }],
					}),
				},
			},
		};

		// biome-ignore lint/suspicious/noExplicitAny: mock OpenAI client
		const result = await extractAntiPatterns(samples, mockOpenAI as any);

		expect(result).toHaveLength(2);
		expect(result[0].pattern).toBe("Don't use exclamation marks");
		expect(result[0].reason).toBe('Writer never uses them');
		expect(result[1].example).toBeUndefined();
	});

	it('returns empty array on malformed LLM response', async () => {
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
		const result = await extractAntiPatterns(samples, mockOpenAI as any);
		expect(result).toEqual([]);
	});

	it('returns empty array when LLM returns no content', async () => {
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
		const result = await extractAntiPatterns(samples, mockOpenAI as any);
		expect(result).toEqual([]);
	});
});
