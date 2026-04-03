import type { WritingSample } from './types.js';

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

interface RssItem {
	title: string;
	link: string;
	content: string;
	pubDate?: string;
}

/** Parse RSS XML into items — lightweight, no dependency */
function parseRssItems(xml: string): RssItem[] {
	const items: RssItem[] = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	for (let match = itemRegex.exec(xml); match !== null; match = itemRegex.exec(xml)) {
		const block = match[1];
		const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
		const link = block.match(/<link>(.*?)<\/link>/);
		const content =
			block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) ||
			block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
			block.match(/<description>([\s\S]*?)<\/description>/);
		const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/);

		if (content) {
			items.push({
				title: title ? title[1] || title[2] || 'Untitled' : 'Untitled',
				link: link?.[1] || '',
				content: content[1] || content[2] || '',
				pubDate: pubDate?.[1],
			});
		}
	}

	return items;
}

/** Fetch and parse a Substack RSS feed into writing samples */
export async function fetchSubstackPosts(feedUrl: string): Promise<WritingSample[]> {
	const normalizedUrl = feedUrl.endsWith('/feed') ? feedUrl : `${feedUrl.replace(/\/$/, '')}/feed`;

	const res = await fetch(normalizedUrl, {
		headers: { 'User-Agent': 'E25VoiceAgent/0.1' },
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch Substack feed: ${res.status} ${res.statusText}`);
	}

	const xml = await res.text();
	const items = parseRssItems(xml);

	return items.map((item) => ({
		source: 'substack' as const,
		text: stripHtml(item.content),
		title: item.title,
		url: item.link,
		date: item.pubDate,
	}));
}
