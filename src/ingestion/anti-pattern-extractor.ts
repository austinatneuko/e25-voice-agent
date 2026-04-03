import type OpenAI from 'openai';
import type { AntiPattern, WritingSample } from './types.js';

const ANTI_PATTERN_PROMPT = `You are a voice analysis expert. Given writing samples from a specific person, identify patterns that an AI imitating this person should NEVER use.

Focus on:
1. Chatbot-like patterns the person never uses (e.g., "Great question!", "I'd be happy to help!", "It's not X, it's Y" structure)
2. Formality mismatches (if they're casual, flag formal patterns; if they're terse, flag verbose patterns)
3. Structural patterns that would feel fake (e.g., if they never use bullet points, flag bullet point usage)
4. Tone violations (e.g., if they're never sarcastic, flag sarcasm; if they never use emojis, flag emoji usage)
5. Vocabulary mismatches (words or phrases this person would never use)

For each anti-pattern, provide:
- pattern: The specific thing to avoid (be concrete, like "Don't use 'it's not X, it's Y' sentence structure")
- reason: Why this feels wrong for this person's voice
- example: An example of the bad pattern (optional)

Return a JSON array of objects with fields: pattern, reason, example.
Return ONLY valid JSON, no markdown or explanation.`;

/**
 * Use LLM to extract anti-patterns from writing samples.
 * These are specific things the voice agent should NEVER do.
 * Inspired by 1NK Step 4: "Learn what NOT to do"
 */
export async function extractAntiPatterns(
	samples: WritingSample[],
	openai: OpenAI,
	model = 'openrouter/auto',
): Promise<AntiPattern[]> {
	const sampleText = samples
		.slice(0, 10) // Limit to 10 samples to stay within context
		.map((s, i) => `--- Sample ${i + 1} (${s.source}) ---\n${s.text.slice(0, 2000)}`)
		.join('\n\n');

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: ANTI_PATTERN_PROMPT },
			{ role: 'user', content: `Here are the writing samples:\n\n${sampleText}` },
		],
		temperature: 0.3,
	});

	const content = response.choices[0]?.message?.content;
	if (!content) return [];

	try {
		const cleaned = content.replace(/^```json\n?|```$/g, '').trim();
		const parsed = JSON.parse(cleaned) as AntiPattern[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
