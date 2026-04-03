import type OpenAI from 'openai';
import type { CognitiveContext } from './context-assembly.js';

/**
 * Explicit reply plan produced BEFORE generating the actual response.
 * From simulacra PRD FR5: "Before generating a final reply, the system
 * must produce a structured plan."
 */
export interface ReplyPlan {
	goal: string;
	socialMove: string;
	toneGuidance: string;
	mustAvoid: string[];
	topicsToMention: string[];
}

const PLANNER_PROMPT = `You are a reply planner for a voice agent. Given the cognitive context and user message, produce a brief reply plan.

The plan determines HOW to respond before the actual response is written.

Return JSON with these fields:
- goal: What this reply should accomplish (1 sentence)
- socialMove: The social strategy (e.g., "friendly banter", "share expertise", "deflect", "challenge")
- toneGuidance: Specific tone instructions for this reply
- mustAvoid: Array of things to NOT do in this reply
- topicsToMention: Array of relevant topics to weave in (can be empty)

Return ONLY valid JSON.`;

/**
 * Generate an explicit reply plan from cognitive context + user message.
 * The plan drives the response — we don't generate directly from raw context.
 */
export async function planReply(
	context: CognitiveContext,
	userMessage: string,
	openai: OpenAI,
	model = 'minimax/minimax-m2.7',
): Promise<ReplyPlan> {
	const contextSummary = `IDENTITY (SOUL.md):
${context.identity}

ACTIVE CORRECTIONS:
${context.reflections.length > 0 ? context.reflections.join('\n') : '(none)'}

ANTI-PATTERNS (NEVER DO):
${context.planConstraints.antiPatterns.map((p) => `- ${p}`).join('\n')}

TONE: ${context.planConstraints.toneGuidance}
SOCIAL MODE: ${context.planConstraints.socialMode}

RECENT CONVERSATION:
${context.episodicMemory.slice(-4).join('\n')}`;

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: PLANNER_PROMPT },
			{
				role: 'user',
				content: `Context:\n${contextSummary}\n\nUser message to respond to:\n"${userMessage}"`,
			},
		],
		temperature: 0.3,
	});

	const content = response.choices[0]?.message?.content;
	if (!content) return fallbackPlan(context);

	try {
		const cleaned = content.replace(/^```json\n?|```$/g, '').trim();
		return JSON.parse(cleaned) as ReplyPlan;
	} catch {
		return fallbackPlan(context);
	}
}

/** Fallback plan when LLM planning fails */
function fallbackPlan(context: CognitiveContext): ReplyPlan {
	return {
		goal: 'Respond naturally in character',
		socialMove: 'conversational',
		toneGuidance: context.planConstraints.toneGuidance,
		mustAvoid: context.planConstraints.antiPatterns.slice(0, 5),
		topicsToMention: [],
	};
}
