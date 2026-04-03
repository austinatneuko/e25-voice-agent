/**
 * Feedback tracking and fidelity scoring.
 * Tracks corrections vs approvals to measure voice fidelity over time.
 */

export interface FeedbackEntry {
	type: 'correction' | 'approval';
	content: string;
	messageIndex: number;
	timestamp: string;
}

export interface FidelityStats {
	totalResponses: number;
	corrections: number;
	approvals: number;
	fidelityRate: number;
	topCorrections: string[];
	recentTrend: 'improving' | 'stable' | 'degrading';
}

export class FeedbackTracker {
	private entries: FeedbackEntry[] = [];

	addCorrection(content: string, messageIndex: number): void {
		this.entries.push({
			type: 'correction',
			content,
			messageIndex,
			timestamp: new Date().toISOString(),
		});
	}

	addApproval(messageIndex: number): void {
		this.entries.push({
			type: 'approval',
			content: '',
			messageIndex,
			timestamp: new Date().toISOString(),
		});
	}

	getStats(): FidelityStats {
		const corrections = this.entries.filter((e) => e.type === 'correction');
		const approvals = this.entries.filter((e) => e.type === 'approval');
		const total = corrections.length + approvals.length;

		// Recent trend: compare last 5 vs previous 5
		const recent = this.entries.slice(-5);
		const previous = this.entries.slice(-10, -5);
		const recentCorrectionRate =
			recent.length > 0 ? recent.filter((e) => e.type === 'correction').length / recent.length : 0;
		const previousCorrectionRate =
			previous.length > 0
				? previous.filter((e) => e.type === 'correction').length / previous.length
				: 0;

		let recentTrend: 'improving' | 'stable' | 'degrading' = 'stable';
		if (recent.length >= 3 && previous.length >= 3) {
			if (recentCorrectionRate < previousCorrectionRate - 0.1) recentTrend = 'improving';
			else if (recentCorrectionRate > previousCorrectionRate + 0.1) recentTrend = 'degrading';
		}

		return {
			totalResponses: total,
			corrections: corrections.length,
			approvals: approvals.length,
			fidelityRate: total > 0 ? approvals.length / total : 0,
			topCorrections: corrections.slice(-5).map((c) => c.content),
			recentTrend,
		};
	}

	getEntries(): FeedbackEntry[] {
		return [...this.entries];
	}

	/** Export corrections as strings for use as Honcho conclusions */
	getCorrectionsForReflection(): string[] {
		return this.entries.filter((e) => e.type === 'correction').map((e) => e.content);
	}
}
