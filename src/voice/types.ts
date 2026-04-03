import { z } from 'zod';
import { AntiPatternSchema, StyleMarkersSchema } from '../ingestion/types.js';

export const VoiceIdentitySchema = z.object({
	name: z.string().optional(),
	age: z.string().optional(),
	role: z.string().optional(),
	mission: z.string().optional(),
	vibe: z.string().optional(),
});

export type VoiceIdentity = z.infer<typeof VoiceIdentitySchema>;

export const SocialModeSchema = z.object({
	strangers: z.string().describe('default tone with strangers'),
	friends: z.string().describe('tone with friends/allies'),
	conflict: z.string().describe('response to hostility or stupidity'),
	expertise: z.string().optional().describe('how they share knowledge'),
});

export type SocialMode = z.infer<typeof SocialModeSchema>;

export const FullVoiceProfileSchema = z.object({
	identity: VoiceIdentitySchema,
	styleMarkers: StyleMarkersSchema.optional(),
	socialModes: SocialModeSchema.optional(),
	antiPatterns: z.array(AntiPatternSchema),
	personality: z.record(z.string(), z.string()).describe('key-value personality traits from Q&A'),
	voiceSummary: z.string().optional(),
	soulMd: z.string().optional().describe('generated SOUL.md content'),
	updatedAt: z.string(),
});

export type FullVoiceProfile = z.infer<typeof FullVoiceProfileSchema>;
