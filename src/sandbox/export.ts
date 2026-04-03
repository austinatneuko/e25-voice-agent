import type { FullVoiceProfile } from '../voice/types.js';
import type { FeedbackEntry } from './feedback.js';
import type { ReflectionResult } from './reflection-job.js';

/**
 * Export a voice profile for portability.
 * Includes SOUL.md, full profile, corrections, and reflections.
 */
export interface VoiceExport {
	version: '1.0';
	exportedAt: string;
	soulMd: string;
	profile: FullVoiceProfile;
	corrections: string[];
	reflections: ReflectionResult | null;
	feedback: FeedbackEntry[];
}

export function exportVoiceProfile(
	soulMd: string,
	profile: FullVoiceProfile,
	corrections: string[],
	reflections: ReflectionResult | null,
	feedback: FeedbackEntry[],
): VoiceExport {
	return {
		version: '1.0',
		exportedAt: new Date().toISOString(),
		soulMd,
		profile,
		corrections,
		reflections,
		feedback,
	};
}

/** Serialize to JSON string for download */
export function serializeExport(exp: VoiceExport): string {
	return JSON.stringify(exp, null, 2);
}
