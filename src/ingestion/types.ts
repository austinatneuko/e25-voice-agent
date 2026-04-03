import { z } from 'zod';

export const WritingSampleSchema = z.object({
	source: z.enum(['substack', 'x', 'upload']),
	text: z.string().min(1),
	title: z.string().optional(),
	url: z.string().url().optional(),
	date: z.string().optional(),
});

export type WritingSample = z.infer<typeof WritingSampleSchema>;

export const StyleMarkersSchema = z.object({
	sentenceLength: z.object({
		avg: z.number(),
		short: z.number().describe('percentage of sentences under 10 words'),
		medium: z.number().describe('percentage of sentences 10-25 words'),
		long: z.number().describe('percentage of sentences over 25 words'),
	}),
	vocabulary: z.object({
		avgWordLength: z.number(),
		uniqueWordRatio: z.number().describe('type-token ratio'),
		signaturePhrases: z.array(z.string()).describe('repeated distinctive phrases'),
	}),
	tone: z.object({
		formality: z.number().min(0).max(1).describe('0=very casual, 1=very formal'),
		humor: z.number().min(0).max(1),
		sarcasm: z.number().min(0).max(1),
		warmth: z.number().min(0).max(1),
	}),
	formatting: z.object({
		usesEmoji: z.boolean(),
		usesAllLowercase: z.boolean(),
		usesAllCaps: z.boolean(),
		avgParagraphLength: z.number(),
		usesPunctuation: z.object({
			exclamation: z.number().describe('per 100 sentences'),
			question: z.number().describe('per 100 sentences'),
			ellipsis: z.number().describe('per 100 sentences'),
			dash: z.number().describe('per 100 sentences'),
		}),
	}),
	topics: z.array(z.string()).describe('recurring topic clusters'),
});

export type StyleMarkers = z.infer<typeof StyleMarkersSchema>;

export const AntiPatternSchema = z.object({
	pattern: z.string().describe('specific thing to avoid'),
	reason: z.string().describe('why this feels wrong for this voice'),
	example: z.string().optional().describe('example of the bad pattern'),
});

export type AntiPattern = z.infer<typeof AntiPatternSchema>;

export const VoiceProfileSchema = z.object({
	styleMarkers: StyleMarkersSchema.optional(),
	antiPatterns: z.array(AntiPatternSchema),
	sampleCount: z.number(),
	totalWords: z.number(),
	sources: z.array(z.enum(['substack', 'x', 'upload'])),
	rawSummary: z.string().optional().describe('LLM-generated voice summary'),
});

export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;
