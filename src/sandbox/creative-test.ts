import type OpenAI from 'openai';
import type { FullVoiceProfile } from '../voice/types.js';

/**
 * Creative output testing — 1NK Step 10.
 * Ask the agent to write something creative (paragraph, manifesto, tweet thread)
 * and evaluate whether it sounds authentic.
 */

export interface CreativeTestResult {
	prompt: string;
	output: string;
	selfEvalQuestion: string;
}

const CREATIVE_PROMPTS = [
	'Write a short rant about something you find annoying in your field.',
	'Write a tweet thread (3-5 tweets) about something you care about deeply.',
	'Write a paragraph explaining your hot take to someone who disagrees.',
	'Write a short message to a friend recommending something you love.',
	'Write a response to someone who just said something ignorant about your expertise.',
];

/**
 * Generate a creative output test. The agent writes something
 * in character, then we ask the user if it sounds right.
 */
export async function runCreativeTest(
	soulMd: string,
	profile: FullVoiceProfile,
	openai: OpenAI,
	model = 'minimax/minimax-m2.7',
	promptIndex?: number,
): Promise<CreativeTestResult> {
	const idx = promptIndex ?? Math.floor(Math.random() * CREATIVE_PROMPTS.length);
	const prompt = CREATIVE_PROMPTS[idx % CREATIVE_PROMPTS.length];

	const antiPatterns = profile.antiPatterns
		.slice(0, 10)
		.map((ap) => `- ${ap.pattern}`)
		.join('\n');

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{
				role: 'system',
				content: `${soulMd}\n\n--- MUST AVOID ---\n${antiPatterns}\n\n--- INSTRUCTIONS ---\nYou ARE this person. Write in their voice. Do NOT break character.`,
			},
			{ role: 'user', content: prompt },
		],
		temperature: 0.7,
	});

	const output = response.choices[0]?.message?.content ?? '';

	return {
		prompt,
		output,
		selfEvalQuestion: 'Does this sound like you? If not, what feels off?',
	};
}

/** Get all available creative prompts */
export function getCreativePrompts(): string[] {
	return [...CREATIVE_PROMPTS];
}
