/**
 * Interview questions organized by the 1NK voice-building methodology steps.
 * Each step targets a different dimension of voice/personality.
 *
 * Steps 1-6 from "Building a Soul: The Process of Creating 1NK":
 * 1. Identity foundation
 * 2. Voice definition
 * 3. Social dynamics
 * 4. Anti-patterns (what NOT to do)
 * 5. Personality Q&A
 * 6. Relationships (optional)
 */

export interface InterviewQuestion {
	id: string;
	step: number;
	stepName: string;
	question: string;
	/** Tags for matching against writing analysis (skip if already answered) */
	tags: string[];
	/** Whether this question is required or optional */
	required: boolean;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
	// Step 1: Identity Foundation
	{
		id: 'identity-who',
		step: 1,
		stepName: 'identity',
		question: "Who are you? Give me your name, age, and what you'd tell a stranger at a party.",
		tags: ['identity', 'name', 'age'],
		required: true,
	},
	{
		id: 'identity-role',
		step: 1,
		stepName: 'identity',
		question: "What do you do? Not your job title — what's your actual role in the world?",
		tags: ['identity', 'role', 'occupation'],
		required: true,
	},
	{
		id: 'identity-mission',
		step: 1,
		stepName: 'identity',
		question: "What drives you? What's the thing you care about that most people don't get?",
		tags: ['identity', 'mission', 'values'],
		required: true,
	},

	// Step 2: Voice Definition
	{
		id: 'voice-style',
		step: 2,
		stepName: 'voice',
		question:
			'How do you write? Short and punchy or long and detailed? Formal or casual? All lowercase or proper grammar?',
		tags: ['voice', 'style', 'formality'],
		required: true,
	},
	{
		id: 'voice-vibe',
		step: 2,
		stepName: 'voice',
		question:
			"What's your vibe when you're texting or posting? Think of a specific person or era that captures your energy.",
		tags: ['voice', 'vibe', 'energy'],
		required: true,
	},
	{
		id: 'voice-examples',
		step: 2,
		stepName: 'voice',
		question:
			'Give me an example of something you recently wrote that felt really "you" — a text, a post, an email, anything.',
		tags: ['voice', 'example'],
		required: false,
	},

	// Step 3: Social Dynamics
	{
		id: 'social-strangers',
		step: 3,
		stepName: 'social',
		question:
			'How do you talk to strangers online? Are you warm? Guarded? Do you roast people or welcome them?',
		tags: ['social', 'strangers', 'default-tone'],
		required: true,
	},
	{
		id: 'social-friends',
		step: 3,
		stepName: 'social',
		question:
			"How does your tone change with friends vs. strangers? What do your friends get that others don't?",
		tags: ['social', 'friends', 'warmth'],
		required: true,
	},
	{
		id: 'social-conflict',
		step: 3,
		stepName: 'social',
		question:
			"When someone says something dumb or annoying to you, what's your instinct? Ignore? Clap back? Educate?",
		tags: ['social', 'conflict', 'aggression'],
		required: true,
	},
	{
		id: 'social-expertise',
		step: 3,
		stepName: 'social',
		question:
			"When someone asks about something you're an expert in, how do you respond? Teach? Show off? Keep it brief?",
		tags: ['social', 'expertise', 'knowledge'],
		required: false,
	},

	// Step 4: Anti-Patterns
	{
		id: 'anti-cringe',
		step: 4,
		stepName: 'anti-patterns',
		question:
			'What makes you cringe when you see an AI or chatbot talking? What patterns feel fake to you?',
		tags: ['anti-pattern', 'cringe', 'chatbot'],
		required: true,
	},
	{
		id: 'anti-never',
		step: 4,
		stepName: 'anti-patterns',
		question:
			'What would you NEVER say? Specific phrases, sentence structures, or tones that are not you at all.',
		tags: ['anti-pattern', 'never-say', 'vocabulary'],
		required: true,
	},
	{
		id: 'anti-overdo',
		step: 4,
		stepName: 'anti-patterns',
		question:
			'What do people get wrong when they try to imitate you or people like you? What gets overdone?',
		tags: ['anti-pattern', 'imitation', 'overdone'],
		required: false,
	},

	// Step 5: Personality Q&A
	{
		id: 'personality-music',
		step: 5,
		stepName: 'personality',
		question: 'What music are you into? Not what sounds cultured — what do you actually listen to?',
		tags: ['personality', 'music'],
		required: false,
	},
	{
		id: 'personality-media',
		step: 5,
		stepName: 'personality',
		question:
			"What do you consume? Shows, podcasts, books, games, feeds — what's in your rotation right now?",
		tags: ['personality', 'media', 'interests'],
		required: false,
	},
	{
		id: 'personality-hotakes',
		step: 5,
		stepName: 'personality',
		question: 'Give me a hot take. Something you believe that most people would disagree with.',
		tags: ['personality', 'opinions', 'hot-take'],
		required: true,
	},
	{
		id: 'personality-humor',
		step: 5,
		stepName: 'personality',
		question:
			"What's funny to you? Dry humor? Absurdist? Sarcasm? Puns? Give me an example of something that made you laugh recently.",
		tags: ['personality', 'humor', 'comedy'],
		required: true,
	},
	{
		id: 'personality-pet-peeve',
		step: 5,
		stepName: 'personality',
		question: "What's a pet peeve of yours? Something small that bothers you more than it should.",
		tags: ['personality', 'pet-peeve', 'annoyance'],
		required: false,
	},
	{
		id: 'personality-passionate',
		step: 5,
		stepName: 'personality',
		question:
			'What could you talk about for an hour without getting bored? The thing that lights you up.',
		tags: ['personality', 'passion', 'expertise'],
		required: true,
	},
	{
		id: 'personality-casual',
		step: 5,
		stepName: 'personality',
		question:
			"What's your go-to comfort food? Favorite drink? The stuff you reach for when you're not trying to impress anyone.",
		tags: ['personality', 'casual', 'comfort'],
		required: false,
	},

	// Step 6: Relationships (optional)
	{
		id: 'relationships-important',
		step: 6,
		stepName: 'relationships',
		question:
			'Who are the 2-3 most important people in your life? Not their names necessarily — what role do they play?',
		tags: ['relationships', 'people', 'connections'],
		required: false,
	},
	{
		id: 'relationships-influence',
		step: 6,
		stepName: 'relationships',
		question:
			'Who influences how you think or talk? A friend, a public figure, a character? What did you pick up from them?',
		tags: ['relationships', 'influence', 'role-model'],
		required: false,
	},
];

/** Get questions for a specific step */
export function getStepQuestions(step: number): InterviewQuestion[] {
	return INTERVIEW_QUESTIONS.filter((q) => q.step === step);
}

/** Get all required questions */
export function getRequiredQuestions(): InterviewQuestion[] {
	return INTERVIEW_QUESTIONS.filter((q) => q.required);
}

/** Get step names in order */
export function getStepNames(): string[] {
	const seen = new Set<string>();
	return INTERVIEW_QUESTIONS.filter((q) => {
		if (seen.has(q.stepName)) return false;
		seen.add(q.stepName);
		return true;
	}).map((q) => q.stepName);
}
