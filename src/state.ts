import type { VoiceProfile, WritingSample } from './ingestion/types.js';
import type { InterviewState } from './interview/engine.js';
import type { FullVoiceProfile } from './voice/types.js';

/**
 * In-memory session state for the hackathon MVP.
 * In production this would be backed by Honcho + persistent storage.
 */
export interface AppState {
	/** Raw writing samples ingested */
	writingSamples: WritingSample[];
	/** Analysis from writing samples */
	writingProfile: VoiceProfile | null;
	/** Interview engine state */
	interviewState: InterviewState | null;
	/** Merged full voice profile */
	voiceProfile: FullVoiceProfile | null;
	/** Generated SOUL.md */
	soulMd: string | null;
	/** Conversation history for chat mode */
	conversationHistory: Array<{ role: string; content: string }>;
	/** User corrections (thumbs down feedback) */
	corrections: string[];
}

export function createAppState(): AppState {
	return {
		writingSamples: [],
		writingProfile: null,
		interviewState: null,
		voiceProfile: null,
		soulMd: null,
		conversationHistory: [],
		corrections: [],
	};
}

/** Global singleton state — reset via createAppState() for tests */
export let state = createAppState();

export function resetState(): void {
	state = createAppState();
}
