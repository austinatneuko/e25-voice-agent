import type { AntiPattern, VoiceProfile } from '../ingestion/types.js';
import type { InterviewAnswer } from '../interview/engine.js';
import { extractAntiPatternsFromAnswers } from '../interview/engine.js';
import type { FullVoiceProfile, SocialMode, VoiceIdentity } from './types.js';

/** Extract identity from interview answers (Step 1) */
function extractIdentity(answers: InterviewAnswer[]): VoiceIdentity {
	const identityAnswers = answers.filter((a) => a.stepName === 'identity');
	const identity: VoiceIdentity = {};

	for (const a of identityAnswers) {
		if (a.questionId === 'identity-who') {
			identity.name = a.answer;
		} else if (a.questionId === 'identity-role') {
			identity.role = a.answer;
		} else if (a.questionId === 'identity-mission') {
			identity.mission = a.answer;
		}
	}

	// Extract vibe from voice step
	const vibeAnswer = answers.find((a) => a.questionId === 'voice-vibe');
	if (vibeAnswer) identity.vibe = vibeAnswer.answer;

	return identity;
}

/** Extract social modes from interview answers (Step 3) */
function extractSocialModes(answers: InterviewAnswer[]): SocialMode | undefined {
	const socialAnswers = answers.filter((a) => a.stepName === 'social');
	if (socialAnswers.length === 0) return undefined;

	return {
		strangers: socialAnswers.find((a) => a.questionId === 'social-strangers')?.answer ?? '',
		friends: socialAnswers.find((a) => a.questionId === 'social-friends')?.answer ?? '',
		conflict: socialAnswers.find((a) => a.questionId === 'social-conflict')?.answer ?? '',
		expertise: socialAnswers.find((a) => a.questionId === 'social-expertise')?.answer,
	};
}

/** Extract personality key-value pairs from Q&A (Step 5) */
function extractPersonality(answers: InterviewAnswer[]): Record<string, string> {
	const personalityAnswers = answers.filter((a) => a.stepName === 'personality');
	const personality: Record<string, string> = {};

	for (const a of personalityAnswers) {
		const key = a.questionId.replace('personality-', '');
		personality[key] = a.answer;
	}

	// Also include relationships if present
	const relationshipAnswers = answers.filter((a) => a.stepName === 'relationships');
	for (const a of relationshipAnswers) {
		const key = a.questionId.replace('relationships-', '');
		personality[key] = a.answer;
	}

	return personality;
}

/**
 * Build a full voice profile by merging writing analysis + interview answers.
 * This is the core data structure that feeds into SOUL.md generation.
 */
export function buildVoiceProfile(
	writingProfile: VoiceProfile | null,
	interviewAnswers: InterviewAnswer[],
): FullVoiceProfile {
	const identity = extractIdentity(interviewAnswers);
	const socialModes = extractSocialModes(interviewAnswers);
	const personality = extractPersonality(interviewAnswers);

	// Merge anti-patterns from both sources
	const writingAntiPatterns = writingProfile?.antiPatterns ?? [];
	const interviewAntiPatterns = extractAntiPatternsFromAnswers(interviewAnswers);
	const allAntiPatterns = deduplicateAntiPatterns([
		...writingAntiPatterns,
		...interviewAntiPatterns,
	]);

	return {
		identity,
		styleMarkers: writingProfile?.styleMarkers,
		socialModes,
		antiPatterns: allAntiPatterns,
		personality,
		voiceSummary: writingProfile?.rawSummary,
		updatedAt: new Date().toISOString(),
	};
}

/** Remove near-duplicate anti-patterns */
function deduplicateAntiPatterns(patterns: AntiPattern[]): AntiPattern[] {
	const seen = new Set<string>();
	return patterns.filter((p) => {
		const normalized = p.pattern.toLowerCase().trim();
		if (seen.has(normalized)) return false;
		seen.add(normalized);
		return true;
	});
}

/**
 * Incrementally update a profile with new interview answers.
 * Follows 1NK principle: new data enriches, doesn't rebuild from scratch.
 */
export function updateVoiceProfile(
	existing: FullVoiceProfile,
	newAnswers: InterviewAnswer[],
): FullVoiceProfile {
	const newIdentity = extractIdentity(newAnswers);
	const newSocialModes = extractSocialModes(newAnswers);
	const newPersonality = extractPersonality(newAnswers);
	const newAntiPatterns = extractAntiPatternsFromAnswers(newAnswers);

	return {
		...existing,
		identity: { ...existing.identity, ...stripEmpty(newIdentity) },
		socialModes: newSocialModes ?? existing.socialModes,
		personality: { ...existing.personality, ...newPersonality },
		antiPatterns: deduplicateAntiPatterns([...existing.antiPatterns, ...newAntiPatterns]),
		updatedAt: new Date().toISOString(),
	};
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''));
}
