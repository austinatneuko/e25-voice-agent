import { z } from 'zod';

const envSchema = z.object({
	HONCHO_API_KEY: z.string().min(1).optional(),
	HONCHO_WORKSPACE_ID: z.string().min(1).optional(),
	OPENROUTER_API_KEY: z.string().min(1).optional(),
	X_BEARER_TOKEN: z.string().min(1).optional(),
	PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
	return envSchema.parse(process.env);
}
