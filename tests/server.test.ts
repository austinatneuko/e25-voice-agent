import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('server', () => {
	const app = createApp();

	it('GET /health returns ok', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe('ok');
		expect(body.version).toBe('0.1.0');
	});
});
