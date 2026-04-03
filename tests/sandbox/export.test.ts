import { describe, expect, it } from 'vitest';
import { exportVoiceProfile, serializeExport } from '../../src/sandbox/export.js';
import type { FullVoiceProfile } from '../../src/voice/types.js';

const mockProfile: FullVoiceProfile = {
	identity: { name: 'test', role: 'tester' },
	antiPatterns: [{ pattern: 'no exclamation', reason: 'not the vibe' }],
	personality: { humor: 'dry' },
	updatedAt: '2026-04-03T00:00:00Z',
};

describe('exportVoiceProfile', () => {
	it('creates a valid export object', () => {
		const exp = exportVoiceProfile(
			'# SOUL.md\ntest',
			mockProfile,
			['fix 1', 'fix 2'],
			{ rules: ['rule 1'], correctionCount: 2, timestamp: '2026-04-03T00:00:00Z' },
			[],
		);

		expect(exp.version).toBe('1.0');
		expect(exp.soulMd).toContain('SOUL.md');
		expect(exp.profile.identity.name).toBe('test');
		expect(exp.corrections).toHaveLength(2);
		expect(exp.reflections?.rules).toHaveLength(1);
	});

	it('serializes to valid JSON', () => {
		const exp = exportVoiceProfile('# SOUL', mockProfile, [], null, []);
		const json = serializeExport(exp);
		const parsed = JSON.parse(json);
		expect(parsed.version).toBe('1.0');
		expect(parsed.soulMd).toBe('# SOUL');
	});
});
