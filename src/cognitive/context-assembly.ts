import type { FullVoiceProfile } from '../voice/types.js';

/**
 * Structured cognitive context for response generation.
 * Maps to simulacra PRD FR1: identity, reflections, social_model,
 * episodic_memory, plan_constraints.
 *
 * Each section is assembled independently and preserved through
 * prompt construction (not flattened into a blob).
 */
export interface CognitiveContext {
	/** Stable SOUL.md — who you are, how you act */
	identity: string;
	/** Higher-order synthesized beliefs from corrections and interactions */
	reflections: string[];
	/** Per-interlocutor understanding (if returning user) */
	socialModel: string | null;
	/** Relevant past exchanges */
	episodicMemory: string[];
	/** Anti-patterns, tone guidance, behavioral directives */
	planConstraints: PlanConstraints;
}

export interface PlanConstraints {
	antiPatterns: string[];
	toneGuidance: string;
	socialMode: string;
}

/**
 * Assemble cognitive context from a voice profile and conversation history.
 *
 * In a full implementation, reflections and episodic memory would come from
 * Honcho via conclusions and session retrieval. For the hackathon MVP,
 * we build from local state.
 */
export function assembleCognitiveContext(
	profile: FullVoiceProfile,
	soulMd: string,
	conversationHistory: Array<{ role: string; content: string }>,
	corrections: string[],
): CognitiveContext {
	// Identity = SOUL.md (stable, rarely changes)
	const identity = soulMd;

	// Reflections = corrections stored as high-importance conclusions
	const reflections = corrections.length > 0 ? corrections.map((c) => `CORRECTION: ${c}`) : [];

	// Episodic memory = recent conversation turns (simple for MVP)
	const episodicMemory = conversationHistory
		.slice(-10) // last 10 turns
		.map((m) => `${m.role}: ${m.content}`);

	// Plan constraints from profile
	const planConstraints: PlanConstraints = {
		antiPatterns: profile.antiPatterns.map((ap) => ap.pattern),
		toneGuidance: deriveToneGuidance(profile),
		socialMode: deriveSocialMode(profile, conversationHistory),
	};

	return {
		identity,
		reflections,
		socialModel: null, // Will come from Honcho peer cards in full implementation
		episodicMemory,
		planConstraints,
	};
}

function deriveToneGuidance(profile: FullVoiceProfile): string {
	const markers = profile.styleMarkers;
	if (!markers) return 'Match the voice described in the identity section.';

	const parts: string[] = [];
	if (markers.tone.formality < 0.3) parts.push('very casual');
	else if (markers.tone.formality > 0.7) parts.push('formal');
	if (markers.tone.humor > 0.5) parts.push('humorous');
	if (markers.tone.sarcasm > 0.5) parts.push('sarcastic');
	if (markers.formatting.usesAllLowercase) parts.push('all lowercase');

	return parts.length > 0 ? `Tone: ${parts.join(', ')}` : 'Tone: match the voice profile';
}

function deriveSocialMode(
	profile: FullVoiceProfile,
	history: Array<{ role: string; content: string }>,
): string {
	if (!profile.socialModes) return 'default';

	// Simple heuristic: if conversation is new (< 3 turns), use strangers mode
	if (history.length < 6) {
		return profile.socialModes.strangers || 'default';
	}
	return profile.socialModes.friends || 'default';
}
