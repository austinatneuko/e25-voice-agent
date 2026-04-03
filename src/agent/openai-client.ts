import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(apiKey?: string): OpenAI {
	if (client) return client;

	const key = apiKey ?? process.env.OPENROUTER_API_KEY;
	if (!key) throw new Error('OPENROUTER_API_KEY not set');

	client = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: key,
	});

	return client;
}
