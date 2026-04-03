import { useState } from 'react';
import { type SamplePreview, api } from '@/lib/api';
import type { SpriteState } from '@/components/SoulSprite';
import { SoulSprite } from '@/components/SoulSprite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Props {
	sources: Set<string>;
	samples: SamplePreview[];
	onRefreshSamples: () => Promise<void>;
	onAnalyze: () => Promise<void>;
	spriteState: SpriteState;
	setSpriteState: (s: SpriteState) => void;
}

export function IngestStep({ sources, samples, onRefreshSamples, onAnalyze, spriteState, setSpriteState }: Props) {
	const [text, setText] = useState('');
	const [substackUrl, setSubstackUrl] = useState('');
	const [xHandle, setXHandle] = useState('');
	const [loading, setLoading] = useState(false);
	const [loadingMsg, setLoadingMsg] = useState('');
	const [error, setError] = useState('');
	const [analyzing, setAnalyzing] = useState(false);

	async function ingestText() {
		if (!text.trim()) return;
		setLoading(true);
		setError('');
		try {
			await api.ingestText(text, 'pasted text');
			setText('');
			await onRefreshSamples();
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	}

	async function ingestSubstack() {
		if (!substackUrl.trim()) return;
		setLoading(true);
		setLoadingMsg('fetching substack posts...');
		setSpriteState('reading');
		setError('');
		try {
			await api.ingestSubstack(substackUrl);
			setSubstackUrl('');
			await onRefreshSamples();
		} catch (e) {
			setError(`substack failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingMsg('');
			setSpriteState('idle');
		}
	}

	async function ingestX() {
		if (!xHandle.trim()) return;
		setLoading(true);
		setLoadingMsg('fetching tweets...');
		setSpriteState('reading');
		setError('');
		try {
			await api.ingestX(xHandle.replace('@', ''));
			setXHandle('');
			await onRefreshSamples();
		} catch (e) {
			setError(`tweet fetch failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingMsg('');
			setSpriteState('idle');
		}
	}

	async function handleAnalyze() {
		setAnalyzing(true);
		setError('');
		try {
			await onAnalyze();
		} catch (e) {
			setError(`analysis failed: ${e}`);
			setAnalyzing(false);
		}
	}

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-4">
			<div className="flex justify-center py-2">
				<SoulSprite state={spriteState} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">add your writing</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{sources.has('text') && (
						<div className="space-y-2">
							<Textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="paste writing samples — tweets, blog posts, messages, anything that sounds like you..."
								rows={4}
								className="resize-none"
							/>
							<Button onClick={ingestText} disabled={loading || !text.trim()} variant="outline" className="w-full">
								add text
							</Button>
						</div>
					)}

					{sources.has('text') && (sources.has('substack') || sources.has('x')) && <Separator />}

					{sources.has('substack') && (
						<div className="flex gap-2">
							<Input
								value={substackUrl}
								onChange={(e) => setSubstackUrl(e.target.value)}
								placeholder="substack url (e.g. yourname.substack.com)"
							/>
							<Button onClick={ingestSubstack} disabled={loading || !substackUrl.trim()} variant="outline">
								fetch
							</Button>
						</div>
					)}

					{sources.has('x') && (
						<div className="flex gap-2">
							<Input
								value={xHandle}
								onChange={(e) => setXHandle(e.target.value)}
								placeholder="x handle (e.g. @elonmusk)"
							/>
							<Button onClick={ingestX} disabled={loading || !xHandle.trim()} variant="outline">
								fetch
							</Button>
						</div>
					)}

					{loadingMsg && <p className="text-sm text-muted-foreground animate-pulse">{loadingMsg}</p>}
					{error && <p className="text-sm text-destructive">{error}</p>}
				</CardContent>
			</Card>

			{samples.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">
								{samples.length} sample{samples.length > 1 ? 's' : ''} ingested
							</CardTitle>
							<span className="text-xs text-muted-foreground">
								{samples.reduce((sum, s) => sum + s.wordCount, 0)} words
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-48">
							<div className="space-y-3">
								{samples.map((s, i) => (
									<div key={i} className="border-b pb-2 last:border-0">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="outline" className="text-[10px]">{s.source}</Badge>
											{s.title && <span className="text-xs font-medium truncate">{s.title}</span>}
											<span className="text-[10px] text-muted-foreground ml-auto">{s.wordCount}w</span>
										</div>
										<p className="text-xs text-muted-foreground leading-relaxed">{s.preview}</p>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			)}

			{samples.length > 0 && (
				<Button onClick={handleAnalyze} disabled={analyzing} className="w-full" size="lg">
					{analyzing ? 'analyzing voice (10-20s)...' : `analyze ${samples.length} samples`}
				</Button>
			)}
		</div>
	);
}
