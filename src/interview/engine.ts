import type OpenAI from 'openai';
import type { AntiPattern, VoiceProfile } from '../ingestion/types.js';
import { getStepNames, INTERVIEW_QUESTIONS, type InterviewQuestion } from './questions.js';

export interface InterviewAnswer {
	questionId: string;
	question: string;
	answer: string;
	step: number;
	stepName: string;
	timestamp: string;
}

export interface InterviewState {
	answers: InterviewAnswer[];
	currentStep: number;
	currentQuestionIndex: number;
	completed: boolean;
	skippedQuestionIds: Set<string>;
}

export interface SelfEvalResult {
	sampleResponse: string;
	question: string;
}

/**
 * Create a fresh interview state.
 * If a VoiceProfile exists from writing analysis, skip questions that are already covered.
 */
export function createInterviewState(existingProfile?: VoiceProfile): InterviewState {
	const skippedQuestionIds = new Set<string>();

	if (existingProfile) {
		// If we already have style markers from writing, skip voice-style questions
		if (existingProfile.styleMarkers) {
			skippedQuestionIds.add('voice-style');
		}
		// If we already have anti-patterns from writing analysis, skip the first anti-pattern Q
		if (existingProfile.antiPatterns.length >= 3) {
			skippedQuestionIds.add('anti-cringe');
		}
	}

	return {
		answers: [],
		currentStep: 1,
		currentQuestionIndex: 0,
		completed: false,
		skippedQuestionIds,
	};
}

/** Get the next unanswered question, respecting skip list */
export function getNextQuestion(state: InterviewState): InterviewQuestion | null {
	const answeredIds = new Set(state.answers.map((a) => a.questionId));
	const remaining = INTERVIEW_QUESTIONS.filter(
		(q) => !answeredIds.has(q.id) && !state.skippedQuestionIds.has(q.id),
	);

	if (remaining.length === 0) return null;
	return remaining[0];
}

/** Record an answer and advance the state */
export function recordAnswer(
	state: InterviewState,
	questionId: string,
	answer: string,
): InterviewState {
	const question = INTERVIEW_QUESTIONS.find((q) => q.id === questionId);
	if (!question) throw new Error(`Unknown question: ${questionId}`);

	const newAnswer: InterviewAnswer = {
		questionId,
		question: question.question,
		answer,
		step: question.step,
		stepName: question.stepName,
		timestamp: new Date().toISOString(),
	};

	const answers = [...state.answers, newAnswer];
	const next = getNextQuestion({ ...state, answers });

	return {
		answers,
		currentStep: next?.step ?? state.currentStep,
		currentQuestionIndex: state.currentQuestionIndex + 1,
		completed: next === null,
		skippedQuestionIds: state.skippedQuestionIds,
	};
}

/** Skip a question */
export function skipQuestion(state: InterviewState, questionId: string): InterviewState {
	const newSkipped = new Set(state.skippedQuestionIds);
	newSkipped.add(questionId);
	return { ...state, skippedQuestionIds: newSkipped };
}

/** Get progress info */
export function getProgress(state: InterviewState): {
	answered: number;
	total: number;
	skipped: number;
	currentStepName: string;
	stepsCompleted: string[];
	stepsRemaining: string[];
} {
	const answeredIds = new Set(state.answers.map((a) => a.questionId));
	const activeQuestions = INTERVIEW_QUESTIONS.filter((q) => !state.skippedQuestionIds.has(q.id));
	const stepNames = getStepNames();
	const completedSteps = stepNames.filter((name) => {
		const stepQuestions = activeQuestions.filter((q) => q.stepName === name);
		return stepQuestions.length > 0 && stepQuestions.every((q) => answeredIds.has(q.id));
	});

	const next = getNextQuestion(state);
	return {
		answered: state.answers.length,
		total: activeQuestions.length,
		skipped: state.skippedQuestionIds.size,
		currentStepName: next?.stepName ?? 'complete',
		stepsCompleted: completedSteps,
		stepsRemaining: stepNames.filter((s) => !completedSteps.includes(s)),
	};
}

/**
 * Generate a self-evaluation sample.
 * The agent produces a short response in the learned voice, and we ask "does this sound like you?"
 * Based on 1NK methodology: "The character should evaluate itself."
 */
export async function generateSelfEval(
	answers: InterviewAnswer[],
	openai: OpenAI,
	model = 'openrouter/auto',
): Promise<SelfEvalResult> {
	const context = answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');

	const response = await openai.chat.completions.create({
		model,
		messages: [
			{
				role: 'system',
				content: `Based on these interview answers, you ARE this person. Write a short casual message (2-3 sentences) responding to someone who just said "hey, what are you working on lately?" — write it exactly how this person would.\n\nInterview answers:\n${context}`,
			},
			{
				role: 'user',
				content: 'hey, what are you working on lately?',
			},
		],
		temperature: 0.7,
	});

	return {
		sampleResponse: response.choices[0]?.message?.content ?? '',
		question: 'Does this sound like you? If not, what feels off?',
	};
}

/** Convert interview answers into anti-patterns (from Step 4 answers) */
export function extractAntiPatternsFromAnswers(answers: InterviewAnswer[]): AntiPattern[] {
	const antiPatternAnswers = answers.filter((a) => a.stepName === 'anti-patterns');
	const patterns: AntiPattern[] = [];

	for (const answer of antiPatternAnswers) {
		// Split on common delimiters (newlines, semicolons, numbered lists)
		const items = answer.answer
			.split(/[;\n]|\d+\.\s/)
			.map((s) => s.trim())
			.filter((s) => s.length > 5);

		for (const item of items) {
			patterns.push({
				pattern: item,
				reason: `From interview question: "${answer.question}"`,
			});
		}
	}

	return patterns;
}
