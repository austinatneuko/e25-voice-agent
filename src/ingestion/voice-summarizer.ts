import type OpenAI from 'openai';
import type { StyleMarkers, WritingSample } from './types.js';

const VOICE_SUMMARY_PROMPT = `You are a voice profiling expert. Given writing samples and statistical style analysis from a specific person, write a concise voice profile summary.

Cover:
1. Overall writing style in 1-2 sentences
2. Tone and personality (formal/casual, humor, warmth, etc.)
3. Sentence structure preferences (short/long, fragments, etc.)
4. Distinctive vocabulary or phrasing habits
5. Topics and interests that come through

Also rate the following on a 0-1 scale:
- formality (0=very casual, 1=very formal)
- humor (0=serious, 1=very humorous)
- sarcasm (0=never sarcastic, 1=very sarcastic)
- warmth (0=cold/distant, 1=very warm)

Return JSON with fields: summary (string), formality (number), humor (number), sarcasm (number), warmth (number).
Return ONLY valid JSON.`;

/**
 * Use LLM to generate a voice summary and refined tone scores.
 * Returns the summary text and updated tone values.
 */
export async function generateVoiceSummary(
	samples: WritingSample[],
	styleMarkers: StyleMarkers,
	openai: OpenAI,
	model = 'minimax/minimax-m2.7',
): Promise<{ summary: string; tone: StyleMarkers['tone'] }> {
	const sampleText = samples
		.slice(0, 8)
		.map((s, i) => `--- Sample ${i + 1} (${s.source}) ---\n${s.text.slice(0, 1500)}`)
		.join('\n\n');

	const statsContext = `Style analysis:
- Avg sentence length: ${styleMarkers.sentenceLength.avg} words
- Short sentences (<10 words): ${styleMarkers.sentenceLength.short}%
- Long sentences (>25 words): ${styleMarkers.sentenceLength.long}%
- Unique word ratio: ${styleMarkers.vocabulary.uniqueWordRatio}
- Uses emoji: ${styleMarkers.formatting.usesEmoji}
- Uses all lowercase: ${styleMarkers.formatting.usesAllLowercase}
- Exclamation marks: ${styleMarkers.formatting.usesPunctuation.exclamation} per 100 sentences
- Question marks: ${styleMarkers.formatting.usesPunctuation.question} per 100 sentences
- Signature phrases: ${styleMarkers.vocabulary.signaturePhrases.slice(0, 10).join(', ')}
- Top topics: ${styleMarkers.topics.slice(0, 10).join(', ')}`;

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: VOICE_SUMMARY_PROMPT },
			{ role: 'user', content: `${statsContext}\n\nWriting samples:\n\n${sampleText}` },
		],
		temperature: 0.3,
	});

	const content = response.choices[0]?.message?.content;
	if (!content) {
		return { summary: '', tone: styleMarkers.tone };
	}

	try {
		const cleaned = content.replace(/^```json\n?|```$/g, '').trim();
		const parsed = JSON.parse(cleaned) as {
			summary: string;
			formality: number;
			humor: number;
			sarcasm: number;
			warmth: number;
		};

		return {
			summary: parsed.summary || '',
			tone: {
				formality: clamp(parsed.formality ?? styleMarkers.tone.formality),
				humor: clamp(parsed.humor ?? styleMarkers.tone.humor),
				sarcasm: clamp(parsed.sarcasm ?? styleMarkers.tone.sarcasm),
				warmth: clamp(parsed.warmth ?? styleMarkers.tone.warmth),
			},
		};
	} catch {
		return { summary: content, tone: styleMarkers.tone };
	}
}

function clamp(n: number): number {
	return Math.max(0, Math.min(1, n));
}
