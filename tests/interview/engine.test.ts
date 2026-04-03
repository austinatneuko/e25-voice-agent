import { describe, expect, it } from 'vitest';
import type { VoiceProfile } from '../../src/ingestion/types.js';
import {
	createInterviewState,
	extractAntiPatternsFromAnswers,
	getNextQuestion,
	getProgress,
	recordAnswer,
	skipQuestion,
} from '../../src/interview/engine.js';
import { INTERVIEW_QUESTIONS } from '../../src/interview/questions.js';

describe('interview engine', () => {
	it('creates fresh state starting at step 1', () => {
		const state = createInterviewState();
		expect(state.currentStep).toBe(1);
		expect(state.answers).toHaveLength(0);
		expect(state.completed).toBe(false);
		expect(state.skippedQuestionIds.size).toBe(0);
	});

	it('skips voice-style when style markers exist', () => {
		const profile: VoiceProfile = {
			styleMarkers: {
				sentenceLength: { avg: 8, short: 70, medium: 20, long: 10 },
				vocabulary: { avgWordLength: 4, uniqueWordRatio: 0.7, signaturePhrases: [] },
				tone: { formality: 0.2, humor: 0.5, sarcasm: 0.3, warmth: 0.4 },
				formatting: {
					usesEmoji: false,
					usesAllLowercase: true,
					usesAllCaps: false,
					avgParagraphLength: 15,
					usesPunctuation: { exclamation: 5, question: 10, ellipsis: 20, dash: 3 },
				},
				topics: ['crypto', 'hacking'],
			},
			antiPatterns: [],
			sampleCount: 10,
			totalWords: 500,
			sources: ['x'],
		};

		const state = createInterviewState(profile);
		expect(state.skippedQuestionIds.has('voice-style')).toBe(true);
	});

	it('gets first question on fresh state', () => {
		const state = createInterviewState();
		const next = getNextQuestion(state);
		expect(next).not.toBeNull();
		expect(next?.step).toBe(1);
		expect(next?.id).toBe('identity-who');
	});

	it('records answer and advances', () => {
		let state = createInterviewState();
		const firstQ = getNextQuestion(state);
		expect(firstQ).not.toBeNull();

		state = recordAnswer(state, firstQ?.id, 'I am Austin, 30, building agent systems.');
		expect(state.answers).toHaveLength(1);
		expect(state.answers[0].answer).toBe('I am Austin, 30, building agent systems.');

		const secondQ = getNextQuestion(state);
		expect(secondQ).not.toBeNull();
		expect(secondQ?.id).not.toBe(firstQ?.id);
	});

	it('skips questions', () => {
		let state = createInterviewState();
		const firstQ = getNextQuestion(state);
		state = skipQuestion(state, firstQ?.id);

		const next = getNextQuestion(state);
		expect(next?.id).not.toBe(firstQ?.id);
	});

	it('marks completed when all questions answered or skipped', () => {
		let state = createInterviewState();

		// Skip all optional first, then answer all required
		for (const q of INTERVIEW_QUESTIONS) {
			if (!q.required) {
				state = skipQuestion(state, q.id);
			}
		}
		for (const q of INTERVIEW_QUESTIONS) {
			if (q.required) {
				state = recordAnswer(state, q.id, `Answer for ${q.id}`);
			}
		}

		expect(state.completed).toBe(true);
		expect(getNextQuestion(state)).toBeNull();
	});

	it('tracks progress correctly', () => {
		let state = createInterviewState();
		const progress = getProgress(state);

		expect(progress.answered).toBe(0);
		expect(progress.total).toBe(INTERVIEW_QUESTIONS.length);
		expect(progress.currentStepName).toBe('identity');
		expect(progress.stepsRemaining.length).toBeGreaterThan(0);

		// Answer first question
		const firstQ = getNextQuestion(state);
		state = recordAnswer(state, firstQ?.id, 'test answer');
		const updatedProgress = getProgress(state);
		expect(updatedProgress.answered).toBe(1);
	});

	it('extracts anti-patterns from interview answers', () => {
		const answers = [
			{
				questionId: 'anti-cringe',
				question: 'What makes you cringe?',
				answer:
					"Using exclamation marks everywhere; Starting with 'Great question!'; Being overly enthusiastic",
				step: 4,
				stepName: 'anti-patterns',
				timestamp: '2026-04-03T00:00:00Z',
			},
			{
				questionId: 'anti-never',
				question: 'What would you never say?',
				answer: "I'd be happy to help!\nLet me break this down for you\nAs an AI language model",
				step: 4,
				stepName: 'anti-patterns',
				timestamp: '2026-04-03T00:00:00Z',
			},
		];

		const patterns = extractAntiPatternsFromAnswers(answers);
		expect(patterns.length).toBeGreaterThan(3);
		expect(patterns[0].pattern.length).toBeGreaterThan(5);
		expect(patterns[0].reason).toContain('interview question');
	});

	it('throws on unknown question id', () => {
		const state = createInterviewState();
		expect(() => recordAnswer(state, 'nonexistent', 'test')).toThrow('Unknown question');
	});
});
