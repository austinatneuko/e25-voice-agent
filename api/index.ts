import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';

export const config = {
	runtime: 'nodejs',
};

const app = new Hono().basePath('/api');

app.use('*', cors());

app.get('/health', (c) => {
	return c.json({
		status: 'ok',
		version: '0.1.0',
		openrouter: !!process.env.OPENROUTER_API_KEY,
		xApi: !!process.env.X_BEARER_TOKEN,
	});
});

// Lazy import routes to avoid cold start overhead
let routesLoaded = false;

async function loadRoutes() {
	if (routesLoaded) return;
	const [{ ingest }, { interview }, { chat }, { profile }, { sandbox }] = await Promise.all([
		import('../src/routes/ingest.js'),
		import('../src/routes/interview.js'),
		import('../src/routes/chat.js'),
		import('../src/routes/profile.js'),
		import('../src/routes/sandbox.js'),
	]);
	app.route('/ingest', ingest);
	app.route('/interview', interview);
	app.route('/chat', chat);
	app.route('/profile', profile);
	app.route('/sandbox', sandbox);
	routesLoaded = true;
}

// Also handle /health at root level
const root = new Hono();
root.use('*', cors());
root.get('/health', (c) => {
	return c.json({
		status: 'ok',
		version: '0.1.0',
		openrouter: !!process.env.OPENROUTER_API_KEY,
		xApi: !!process.env.X_BEARER_TOKEN,
	});
});
root.all('/api/*', async (c, next) => {
	await loadRoutes();
	return app.fetch(c.req.raw);
});

export default handle(root);
