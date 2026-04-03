import type { WritingSample } from './types.js';

interface Tweet {
	id: string;
	text: string;
	created_at?: string;
}

interface XTimelineResponse {
	data?: Tweet[];
	meta?: { next_token?: string; result_count?: number };
}

/**
 * Fetch recent tweets for a user via X API v2.
 * Requires a bearer token with read access.
 */
export async function fetchTweets(
	handle: string,
	bearerToken: string,
	maxResults = 100,
): Promise<WritingSample[]> {
	// Step 1: resolve handle to user ID
	const userRes = await fetch(
		`https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}`,
		{ headers: { Authorization: `Bearer ${bearerToken}` } },
	);

	if (!userRes.ok) {
		throw new Error(`X API user lookup failed: ${userRes.status} ${userRes.statusText}`);
	}

	const userData = (await userRes.json()) as { data?: { id: string } };
	const userId = userData.data?.id;
	if (!userId) {
		throw new Error(`X user not found: ${handle}`);
	}

	// Step 2: fetch recent tweets (excludes retweets and replies by default)
	const params = new URLSearchParams({
		max_results: String(Math.min(maxResults, 100)),
		'tweet.fields': 'created_at',
		exclude: 'retweets,replies',
	});

	const tweetsRes = await fetch(`https://api.x.com/2/users/${userId}/tweets?${params}`, {
		headers: { Authorization: `Bearer ${bearerToken}` },
	});

	if (!tweetsRes.ok) {
		throw new Error(`X API tweets fetch failed: ${tweetsRes.status} ${tweetsRes.statusText}`);
	}

	const tweetsData = (await tweetsRes.json()) as XTimelineResponse;

	if (!tweetsData.data?.length) {
		return [];
	}

	return tweetsData.data.map((tweet) => ({
		source: 'x' as const,
		text: tweet.text,
		url: `https://x.com/${handle}/status/${tweet.id}`,
		date: tweet.created_at,
	}));
}
