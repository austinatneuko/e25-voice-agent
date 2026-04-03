import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadEnv } from './env.js';

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

	return app;
}
