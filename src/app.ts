import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadEnv } from './env.js';
import { chat } from './routes/chat.js';
import { ingest } from './routes/ingest.js';
import { interview } from './routes/interview.js';
import { profile } from './routes/profile.js';
import { sandbox } from './routes/sandbox.js';
import { voice } from './routes/voice.js';

export function createApp() {
	const env = loadEnv();
	const app = new Hono();

	app.use('*', cors());

	app.get('/health', (c) => {
		return c.json({
			status: 'ok',
			version: '0.1.0',
			honcho: !!env.HONCHO_API_KEY,
			openrouter: !!env.OPENROUTER_API_KEY,
			xApi: !!env.X_BEARER_TOKEN,
		});
	});

	// API routes
	app.route('/api/ingest', ingest);
	app.route('/api/interview', interview);
	app.route('/api/chat', chat);
	app.route('/api/profile', profile);
	app.route('/api/sandbox', sandbox);
	app.route('/api/voice', voice);

	return app;
}
