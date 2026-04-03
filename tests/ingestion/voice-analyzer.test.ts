import { describe, expect, it } from 'vitest';
import type { WritingSample } from '../../src/ingestion/types.js';
import { analyzeStyleMarkers } from '../../src/ingestion/voice-analyzer.js';

const casual: WritingSample[] = [
	{
		source: 'x',
		text: 'lol this is wild. cant believe they shipped that. no way. absolutely not.',
	},
	{
		source: 'x',
		text: 'just deployed the thing. works fine. ship it.',
	},
	{
		source: 'x',
		text: 'why does everyone overthink this. just build it. stop talking about it.',
	},
];

const formal: WritingSample[] = [
	{
		source: 'substack',
		text: 'In this comprehensive analysis, we will examine the fundamental principles that govern distributed systems architecture. The implications of these design decisions are far-reaching and deserve careful consideration by engineering leadership.',
	},
	{
		source: 'substack',
		text: 'Furthermore, the empirical evidence suggests that organizations implementing microservice architectures without adequate operational maturity tend to experience significantly higher rates of service degradation during peak utilization periods.',
	},
];

describe('analyzeStyleMarkers', () => {
	it('detects short casual writing', () => {
		const markers = analyzeStyleMarkers(casual);

		expect(markers.sentenceLength.avg).toBeLessThan(10);
		expect(markers.sentenceLength.short).toBeGreaterThan(50);
		expect(markers.formatting.usesAllLowercase).toBe(true);
		expect(markers.formatting.usesEmoji).toBe(false);
	});

	it('detects long formal writing', () => {
		const markers = analyzeStyleMarkers(formal);

		expect(markers.sentenceLength.avg).toBeGreaterThan(15);
		expect(markers.sentenceLength.long).toBeGreaterThan(0);
		expect(markers.formatting.usesAllLowercase).toBe(false);
	});

	it('extracts topics from word frequency', () => {
		const markers = analyzeStyleMarkers(formal);

		expect(markers.topics.length).toBeGreaterThan(0);
	});

	it('computes vocabulary metrics', () => {
		const markers = analyzeStyleMarkers(casual);

		expect(markers.vocabulary.avgWordLength).toBeGreaterThan(0);
		expect(markers.vocabulary.uniqueWordRatio).toBeGreaterThan(0);
		expect(markers.vocabulary.uniqueWordRatio).toBeLessThanOrEqual(1);
	});

	it('handles empty samples', () => {
		const markers = analyzeStyleMarkers([]);

		expect(markers.sentenceLength.avg).toBe(0);
		expect(markers.vocabulary.avgWordLength).toBe(0);
		expect(markers.topics).toEqual([]);
	});

	it('detects punctuation habits', () => {
		const exclamatory: WritingSample[] = [
			{ source: 'x', text: 'This is amazing! So cool! Wow! Love it! Great work!' },
		];
		const markers = analyzeStyleMarkers(exclamatory);

		expect(markers.formatting.usesPunctuation.exclamation).toBeGreaterThan(50);
	});
});
