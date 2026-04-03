import { Hono } from 'hono';
import { clearSamples, createPersona, listPersonas, resetState, switchPersona } from '../state.js';

const persona = new Hono();

/** GET /api/persona — List all personas */
persona.get('/', async (c) => {
	return c.json({ personas: listPersonas() });
});

/** POST /api/persona — Create a new persona */
persona.post('/', async (c) => {
	const { name } = await c.req.json<{ name: string }>();
	if (!name?.trim()) return c.json({ error: 'name required' }, 400);

	const p = createPersona(name.trim());
	return c.json({ created: true, id: p.id, name: p.name });
});

/** POST /api/persona/switch — Switch active persona */
persona.post('/switch', async (c) => {
	const { id } = await c.req.json<{ id: string }>();
	if (!id) return c.json({ error: 'id required' }, 400);

	const p = switchPersona(id);
	if (!p) return c.json({ error: 'persona not found' }, 404);

	return c.json({ switched: true, id: p.id, name: p.name });
});

/** DELETE /api/persona/samples — Clear ingested samples */
persona.delete('/samples', async (c) => {
	clearSamples();
	return c.json({ cleared: true });
});

/** DELETE /api/persona/reset — Full reset of active persona */
persona.delete('/reset', async (c) => {
	resetState();
	return c.json({ reset: true });
});

export { persona };
