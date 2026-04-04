import type { FullVoiceProfile } from './types.js';

/**
 * Generate a SOUL.md file from a FullVoiceProfile.
 *
 * Follows 1NK principles:
 * - "Keep the soul file lean. Identity and behavior only."
 * - "Active behavioral directives need to be in the soul file."
 * - Specific anti-patterns > vague guidance
 */
export interface Lesson {
	type: 'correction' | 'approval';
	content: string;
}

export function generateSoulMd(
	profile: FullVoiceProfile,
	lessons: Lesson[] = [],
): string {
	const sections: string[] = [];

	sections.push(buildIdentitySection(profile));
	sections.push(buildVoiceRulesSection(profile));

	if (profile.antiPatterns.length > 0) {
		sections.push(buildAntiPatternsSection(profile));
	}

	if (profile.socialModes) {
		sections.push(buildSocialModesSection(profile));
	}

	if (Object.keys(profile.personality).length > 0) {
		sections.push(buildPersonalitySection(profile));
	}

	// Lessons from chat feedback
	if (lessons.length > 0) {
		sections.push(buildLessonsSection(lessons));
	}

	return sections.join('\n\n');
}

function buildIdentitySection(profile: FullVoiceProfile): string {
	const lines = ['# SOUL.md — Who You Are', ''];
	const { identity } = profile;

	if (identity.name) lines.push(identity.name);
	if (identity.role) lines.push(`Role: ${identity.role}`);
	if (identity.mission) lines.push(`Mission: ${identity.mission}`);
	if (identity.vibe) lines.push(`Vibe: ${identity.vibe}`);

	if (profile.voiceSummary) {
		lines.push('', profile.voiceSummary);
	}

	return lines.join('\n');
}

function buildVoiceRulesSection(profile: FullVoiceProfile): string {
	const lines = ['## Voice Rules', ''];
	const markers = profile.styleMarkers;

	if (!markers) {
		lines.push('(No writing samples analyzed yet — voice rules will be generated from samples)');
		return lines.join('\n');
	}

	// Capitalization
	if (markers.formatting.usesAllLowercase) {
		lines.push('- Write in all lowercase. No capitalization.');
	}

	// Sentence length
	if (markers.sentenceLength.short > 60) {
		lines.push('- Keep sentences short. Under 10 words when possible.');
	} else if (markers.sentenceLength.long > 30) {
		lines.push('- Longer, detailed sentences are fine. Be thorough.');
	}

	// Formality
	if (markers.tone.formality < 0.3) {
		lines.push('- Very casual tone. Write like texting a friend.');
	} else if (markers.tone.formality > 0.7) {
		lines.push('- Maintain a professional, considered tone.');
	}

	// Emoji
	if (markers.formatting.usesEmoji) {
		lines.push('- Emoji usage is fine and natural for this voice.');
	} else {
		lines.push('- No emojis. Ever.');
	}

	// Punctuation
	if (markers.formatting.usesPunctuation.exclamation < 5) {
		lines.push('- Rarely use exclamation marks.');
	}
	if (markers.formatting.usesPunctuation.ellipsis > 15) {
		lines.push('- Ellipsis (...) is part of the natural rhythm.');
	}

	// Humor / Sarcasm
	if (markers.tone.humor > 0.6) {
		lines.push('- Humor is core to the voice. Be funny.');
	}
	if (markers.tone.sarcasm > 0.5) {
		lines.push('- Sarcasm is natural. Use it freely.');
	}

	// Signature phrases
	if (markers.vocabulary.signaturePhrases.length > 0) {
		const phrases = markers.vocabulary.signaturePhrases.slice(0, 5).join(', ');
		lines.push(`- Signature phrases: ${phrases}`);
	}

	return lines.join('\n');
}

function buildAntiPatternsSection(profile: FullVoiceProfile): string {
	const lines = ['## NEVER Do This', '', 'These patterns feel fake for this voice:', ''];

	for (const ap of profile.antiPatterns.slice(0, 15)) {
		lines.push(`- ${ap.pattern}`);
		if (ap.example) {
			lines.push(`  Bad example: "${ap.example}"`);
		}
	}

	return lines.join('\n');
}

function buildSocialModesSection(profile: FullVoiceProfile): string {
	const lines = ['## Social Modes', ''];
	const modes = profile.socialModes;
	if (!modes) return '';

	if (modes.strangers) lines.push(`**Strangers**: ${modes.strangers}`);
	if (modes.friends) lines.push(`**Friends**: ${modes.friends}`);
	if (modes.conflict) lines.push(`**Conflict**: ${modes.conflict}`);
	if (modes.expertise) lines.push(`**Expertise**: ${modes.expertise}`);

	return lines.join('\n');
}

function buildPersonalitySection(profile: FullVoiceProfile): string {
	const lines = ['## Personality', ''];

	for (const [key, value] of Object.entries(profile.personality)) {
		lines.push(`**${key}**: ${value}`);
	}

	return lines.join('\n');
}

function buildLessonsSection(lessons: Lesson[]): string {
	const corrections = lessons.filter((l) => l.type === 'correction');
	const approvals = lessons.filter((l) => l.type === 'approval');

	const lines = ['## Lessons Learned', ''];

	if (corrections.length > 0) {
		lines.push('### Things to Avoid (from feedback)', '');
		for (const l of corrections) {
			lines.push(`- ${l.content}`);
		}
	}

	if (approvals.length > 0) {
		lines.push('');
		lines.push('### Good Examples (keep doing this)', '');
		for (const l of approvals) {
			lines.push(`- "${l.content}"`);
		}
	}

	return lines.join('\n');
}
