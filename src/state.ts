import type { VoiceProfile, WritingSample } from './ingestion/types.js';
import type { InterviewState } from './interview/engine.js';
import type { FullVoiceProfile } from './voice/types.js';
import type { Lesson } from './voice/soul-generator.js';

export interface AppState {
	writingSamples: WritingSample[];
	writingProfile: VoiceProfile | null;
	interviewState: InterviewState | null;
	voiceProfile: FullVoiceProfile | null;
	soulMd: string | null;
	conversationHistory: Array<{ role: string; content: string }>;
	corrections: string[];
	lessons: Lesson[];
}

export interface Persona {
	id: string;
	name: string;
	createdAt: string;
	state: AppState;
}

function createAppState(): AppState {
	return {
		writingSamples: [],
		writingProfile: null,
		interviewState: null,
		voiceProfile: null,
		soulMd: null,
		conversationHistory: [],
		corrections: [],
		lessons: [],
	};
}

/** All personas stored in memory */
const personas = new Map<string, Persona>();
let activePersonaId: string | null = null;

/** Get or create the active persona's state */
export function getState(): AppState {
	if (!activePersonaId) {
		// Legacy fallback — create a default persona
		activePersonaId = 'default';
		if (!personas.has('default')) {
			personas.set('default', {
				id: 'default',
				name: 'default',
				createdAt: new Date().toISOString(),
				state: createAppState(),
			});
		}
	}
	return personas.get(activePersonaId)!.state;
}

/** Alias for backward compat — returns active persona state */
export const state = new Proxy({} as AppState, {
	get(_, prop) {
		return (getState() as unknown as Record<string | symbol, unknown>)[prop];
	},
	set(_, prop, value) {
		(getState() as unknown as Record<string | symbol, unknown>)[prop] = value;
		return true;
	},
});

export function createPersona(name: string): Persona {
	const id = `persona-${Date.now()}`;
	const persona: Persona = {
		id,
		name,
		createdAt: new Date().toISOString(),
		state: createAppState(),
	};
	personas.set(id, persona);
	activePersonaId = id;
	return persona;
}

export function switchPersona(id: string): Persona | null {
	const persona = personas.get(id);
	if (!persona) return null;
	activePersonaId = id;
	return persona;
}

export function listPersonas(): Array<{ id: string; name: string; createdAt: string; active: boolean }> {
	return [...personas.values()].map((p) => ({
		id: p.id,
		name: p.name,
		createdAt: p.createdAt,
		active: p.id === activePersonaId,
	}));
}

export function clearSamples(): void {
	const s = getState();
	s.writingSamples = [];
	s.writingProfile = null;
}

export function resetState(): void {
	if (activePersonaId && personas.has(activePersonaId)) {
		personas.set(activePersonaId, {
			...personas.get(activePersonaId)!,
			state: createAppState(),
		});
	}
}
