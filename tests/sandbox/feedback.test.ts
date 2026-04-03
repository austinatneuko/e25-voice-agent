import { describe, expect, it } from 'vitest';
import { FeedbackTracker } from '../../src/sandbox/feedback.js';

describe('FeedbackTracker', () => {
	it('tracks corrections and approvals', () => {
		const tracker = new FeedbackTracker();
		tracker.addApproval(0);
		tracker.addApproval(1);
		tracker.addCorrection('too formal', 2);
		tracker.addApproval(3);

		const stats = tracker.getStats();
		expect(stats.totalResponses).toBe(4);
		expect(stats.corrections).toBe(1);
		expect(stats.approvals).toBe(3);
		expect(stats.fidelityRate).toBe(0.75);
	});

	it('returns 0 fidelity rate when no entries', () => {
		const tracker = new FeedbackTracker();
		const stats = tracker.getStats();
		expect(stats.fidelityRate).toBe(0);
		expect(stats.totalResponses).toBe(0);
	});

	it('tracks recent trend as improving', () => {
		const tracker = new FeedbackTracker();
		// Old: 3 corrections, 2 approvals
		tracker.addCorrection('fix 1', 0);
		tracker.addCorrection('fix 2', 1);
		tracker.addCorrection('fix 3', 2);
		tracker.addApproval(3);
		tracker.addApproval(4);
		// Recent: 0 corrections, 5 approvals
		tracker.addApproval(5);
		tracker.addApproval(6);
		tracker.addApproval(7);
		tracker.addApproval(8);
		tracker.addApproval(9);

		const stats = tracker.getStats();
		expect(stats.recentTrend).toBe('improving');
	});

	it('extracts corrections for reflection', () => {
		const tracker = new FeedbackTracker();
		tracker.addCorrection('too verbose', 0);
		tracker.addApproval(1);
		tracker.addCorrection('used exclamation mark', 2);

		const corrections = tracker.getCorrectionsForReflection();
		expect(corrections).toEqual(['too verbose', 'used exclamation mark']);
	});

	it('returns top corrections in stats', () => {
		const tracker = new FeedbackTracker();
		tracker.addCorrection('fix a', 0);
		tracker.addCorrection('fix b', 1);
		tracker.addCorrection('fix c', 2);

		const stats = tracker.getStats();
		expect(stats.topCorrections).toHaveLength(3);
		expect(stats.topCorrections).toContain('fix a');
	});
});
