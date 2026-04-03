import { describe, expect, it, vi } from 'vitest';
import { fetchSubstackPosts } from '../../src/ingestion/substack.js';

const MOCK_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test Blog</title>
    <item>
      <title>First Post</title>
      <link>https://test.substack.com/p/first-post</link>
      <pubDate>Mon, 01 Apr 2026 00:00:00 GMT</pubDate>
      <content:encoded><![CDATA[<p>This is the <strong>first</strong> post content.</p><p>It has two paragraphs.</p>]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Second Post with CDATA]]></title>
      <link>https://test.substack.com/p/second-post</link>
      <content:encoded><![CDATA[<div>Second post with &amp; entities and <a href="#">links</a>.</div>]]></content:encoded>
    </item>
  </channel>
</rss>`;

describe('fetchSubstackPosts', () => {
	it('parses RSS items into WritingSamples', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(MOCK_RSS),
			}),
		);

		const samples = await fetchSubstackPosts('https://test.substack.com');

		expect(samples).toHaveLength(2);

		expect(samples[0].source).toBe('substack');
		expect(samples[0].title).toBe('First Post');
		expect(samples[0].text).toBe('This is the first post content. It has two paragraphs.');
		expect(samples[0].url).toBe('https://test.substack.com/p/first-post');
		expect(samples[0].date).toBe('Mon, 01 Apr 2026 00:00:00 GMT');

		expect(samples[1].title).toBe('Second Post with CDATA');
		expect(samples[1].text).toContain('Second post with & entities and links');

		vi.unstubAllGlobals();
	});

	it('appends /feed to URL if missing', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(MOCK_RSS),
		});
		vi.stubGlobal('fetch', mockFetch);

		await fetchSubstackPosts('https://test.substack.com');
		expect(mockFetch).toHaveBeenCalledWith('https://test.substack.com/feed', expect.any(Object));

		vi.unstubAllGlobals();
	});

	it('throws on HTTP error', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }),
		);

		await expect(fetchSubstackPosts('https://bad.substack.com')).rejects.toThrow(
			'Failed to fetch Substack feed: 404 Not Found',
		);

		vi.unstubAllGlobals();
	});
});
