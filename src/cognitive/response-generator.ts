import type OpenAI from 'openai';
import type { CognitiveContext } from './context-assembly.js';
import type { ReplyPlan } from './reply-planner.js';

/**
 * Generate a response from a reply plan + cognitive context.
 * The response is driven by the plan, not raw context.
 *
 * This is the "Act" step in the simulacra perceive → retrieve → reflect → plan → act loop.
 */
export async function generateResponse(
	plan: ReplyPlan,
	context: CognitiveContext,
	userMessage: string,
	openai: OpenAI,
	model = 'minimax/minimax-m2.7',
): Promise<string> {
	const systemPrompt = buildSystemPrompt(plan, context);

	const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
		{ role: 'system', content: systemPrompt },
	];

	// Add conversation history
	for (const msg of context.episodicMemory.slice(-8)) {
		const [role, ...contentParts] = msg.split(': ');
		const content = contentParts.join(': ');
		if (role === 'user') {
			messages.push({ role: 'user', content });
		} else if (role === 'assistant') {
			messages.push({ role: 'assistant', content });
		}
	}

	// Add current user message
	messages.push({ role: 'user', content: userMessage });

	const response = await openai.chat.completions.create({
		model,
		messages,
		temperature: 0.7,
	});

	return response.choices[0]?.message?.content ?? '';
}

function buildSystemPrompt(plan: ReplyPlan, context: CognitiveContext): string {
	const sections: string[] = [];

	// Identity (SOUL.md)
	sections.push(context.identity);

	// Reply plan
	sections.push(`--- REPLY PLAN ---
Goal: ${plan.goal}
Social move: ${plan.socialMove}
Tone: ${plan.toneGuidance}`);

	// Must-avoid
	if (plan.mustAvoid.length > 0) {
		sections.push(`--- MUST AVOID ---\n${plan.mustAvoid.map((a) => `- ${a}`).join('\n')}`);
	}

	// Active corrections (reflections)
	if (context.reflections.length > 0) {
		sections.push(`--- ACTIVE CORRECTIONS ---\n${context.reflections.join('\n')}`);
	}

	// Topics to weave in
	if (plan.topicsToMention.length > 0) {
		sections.push(`--- TOPICS TO MENTION ---\n${plan.topicsToMention.join(', ')}`);
	}

	sections.push(
		'--- INSTRUCTIONS ---',
		'You ARE this person. Respond in their voice. Follow the reply plan above.',
		'Do NOT break character. Do NOT mention being an AI.',
		'Keep it natural — match the length and style of the voice profile.',
	);

	return sections.join('\n\n');
}
