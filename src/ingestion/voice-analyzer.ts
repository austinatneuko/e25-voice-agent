import type { StyleMarkers, WritingSample } from './types.js';

/** Split text into sentences (simple heuristic) */
function splitSentences(text: string): string[] {
	return text
		.split(/(?<=[.!?])\s+/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

/** Split text into words */
function splitWords(text: string): string[] {
	return text
		.toLowerCase()
		.split(/\s+/)
		.map((w) => w.replace(/[^a-z0-9'-]/g, ''))
		.filter((w) => w.length > 0);
}

/** Count occurrences of a pattern per 100 sentences */
function countPer100(sentences: string[], pattern: RegExp): number {
	if (sentences.length === 0) return 0;
	const count = sentences.filter((s) => pattern.test(s)).length;
	return Math.round((count / sentences.length) * 100);
}

/** Find repeated phrases (2-4 word n-grams appearing 3+ times) */
function findSignaturePhrases(words: string[], minCount = 3): string[] {
	const ngrams = new Map<string, number>();

	for (let n = 2; n <= 4; n++) {
		for (let i = 0; i <= words.length - n; i++) {
			const gram = words.slice(i, i + n).join(' ');
			ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
		}
	}

	return [...ngrams.entries()]
		.filter(([, count]) => count >= minCount)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20)
		.map(([phrase]) => phrase);
}

/** Detect whether writing deliberately uses all-lowercase (no capitalized sentence starts) */
function detectAllLowercase(text: string): boolean {
	const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
	if (sentences.length < 3) return false;
	const lowercaseStarts = sentences.filter((s) => /^[a-z]/.test(s.trim())).length;
	return lowercaseStarts / sentences.length > 0.8;
}

/** Detect caps usage */
function detectAllCaps(text: string): boolean {
	const words = text.split(/\s+/).filter((w) => /^[A-Z]{2,}$/.test(w));
	const total = text.split(/\s+/).length;
	return total > 0 && words.length / total > 0.3;
}

/** Detect emoji presence */
function detectEmoji(text: string): boolean {
	const emojiPattern =
		/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
	return emojiPattern.test(text);
}

/** Extract topic clusters from text (simple keyword frequency approach) */
function extractTopics(words: string[]): string[] {
	const stopWords = new Set([
		'the',
		'a',
		'an',
		'and',
		'or',
		'but',
		'in',
		'on',
		'at',
		'to',
		'for',
		'of',
		'with',
		'by',
		'from',
		'is',
		'are',
		'was',
		'were',
		'be',
		'been',
		'being',
		'have',
		'has',
		'had',
		'do',
		'does',
		'did',
		'will',
		'would',
		'could',
		'should',
		'may',
		'might',
		'can',
		'shall',
		'it',
		'its',
		'this',
		'that',
		'these',
		'those',
		'i',
		'you',
		'he',
		'she',
		'we',
		'they',
		'me',
		'him',
		'her',
		'us',
		'them',
		'my',
		'your',
		'his',
		'our',
		'their',
		'not',
		'no',
		'just',
		'like',
		'about',
		'so',
		'up',
		'out',
		'if',
		'what',
		'when',
		'how',
		'all',
		'more',
		'some',
		'than',
		'then',
		'very',
		'also',
		'into',
		'over',
		'such',
		'after',
		'before',
	]);

	const freq = new Map<string, number>();
	for (const w of words) {
		if (w.length > 3 && !stopWords.has(w)) {
			freq.set(w, (freq.get(w) || 0) + 1);
		}
	}

	return [...freq.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 15)
		.map(([word]) => word);
}

/** Analyze writing samples to extract statistical style markers */
export function analyzeStyleMarkers(samples: WritingSample[]): StyleMarkers {
	const allText = samples.map((s) => s.text).join('\n\n');
	const sentences = splitSentences(allText);
	const words = splitWords(allText);
	const paragraphs = allText.split(/\n\n+/).filter((p) => p.trim().length > 0);

	// Sentence length distribution
	const sentenceWordCounts = sentences.map((s) => splitWords(s).length);
	const avgSentenceLength =
		sentenceWordCounts.length > 0
			? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length
			: 0;

	const total = sentenceWordCounts.length || 1;
	const short = sentenceWordCounts.filter((c) => c < 10).length / total;
	const long = sentenceWordCounts.filter((c) => c > 25).length / total;
	const medium = 1 - short - long;

	// Vocabulary
	const uniqueWords = new Set(words);
	const avgWordLength =
		words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0;

	// Formatting
	const avgParagraphLength =
		paragraphs.length > 0
			? paragraphs.reduce((sum, p) => sum + splitWords(p).length, 0) / paragraphs.length
			: 0;

	return {
		sentenceLength: {
			avg: Math.round(avgSentenceLength * 10) / 10,
			short: Math.round(short * 100),
			medium: Math.round(medium * 100),
			long: Math.round(long * 100),
		},
		vocabulary: {
			avgWordLength: Math.round(avgWordLength * 10) / 10,
			uniqueWordRatio:
				words.length > 0 ? Math.round((uniqueWords.size / words.length) * 100) / 100 : 0,
			signaturePhrases: findSignaturePhrases(words),
		},
		tone: {
			// Tone analysis requires LLM — return neutral defaults, override via LLM pass
			formality: 0.5,
			humor: 0.3,
			sarcasm: 0.2,
			warmth: 0.5,
		},
		formatting: {
			usesEmoji: detectEmoji(allText),
			usesAllLowercase: detectAllLowercase(allText),
			usesAllCaps: detectAllCaps(allText),
			avgParagraphLength: Math.round(avgParagraphLength),
			usesPunctuation: {
				exclamation: countPer100(sentences, /!/),
				question: countPer100(sentences, /\?/),
				ellipsis: countPer100(sentences, /\.\.\./),
				dash: countPer100(sentences, /[—–-]{2,}|—/),
			},
		},
		topics: extractTopics(words),
	};
}
