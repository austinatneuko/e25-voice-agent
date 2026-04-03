import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const ACTIONS = [
	{
		id: 'x-posts',
		label: 'draft X posts',
		prompt: 'Write 5 tweets in my voice about a topic I care about. Each should be standalone, varied in format (some short, some longer). No hashtags unless I typically use them.',
	},
	{
		id: 'linkedin',
		label: 'draft LinkedIn article',
		prompt: 'Write a short LinkedIn post (3-4 paragraphs) in my voice about something I\'m knowledgeable about. It should feel authentic, not like corporate LinkedIn content.',
	},
	{
		id: 'bio',
		label: 'write my bio',
		prompt: 'Write a short bio (2-3 sentences) in my voice. Something I could use on social media or a website. It should sound like I wrote it, not a PR person.',
	},
	{
		id: 'intro',
		label: 'draft an introduction',
		prompt: 'Write a short self-introduction (like what I\'d say at a meetup or conference) in my voice. Casual, authentic, the way I actually talk.',
	},
];

export function ActionsPanel() {
	const [output, setOutput] = useState('');
	const [loading, setLoading] = useState(false);
	const [activeAction, setActiveAction] = useState<string | null>(null);
	const [customPrompt, setCustomPrompt] = useState('');

	async function runAction(prompt: string, id: string) {
		setLoading(true);
		setActiveAction(id);
		setOutput('');
		try {
			const res = await api.chat(prompt);
			setOutput(res.response);
		} catch (e) {
			setOutput(`error: ${e}`);
		} finally {
			setLoading(false);
		}
	}

	async function runCustom() {
		if (!customPrompt.trim()) return;
		await runAction(customPrompt.trim(), 'custom');
	}

	return (
		<div className="p-4 space-y-4 max-w-2xl mx-auto">
			<div className="space-y-2">
				<h2 className="text-sm font-medium">create something in your voice</h2>
				<p className="text-xs text-muted-foreground">
					your soul is trained — now put it to work
				</p>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{ACTIONS.map((a) => (
					<Button
						key={a.id}
						variant={activeAction === a.id ? 'default' : 'outline'}
						size="sm"
						onClick={() => runAction(a.prompt, a.id)}
						disabled={loading}
						className="text-xs"
					>
						{a.label}
					</Button>
				))}
			</div>

			<div className="flex gap-2">
				<Textarea
					value={customPrompt}
					onChange={(e) => setCustomPrompt(e.target.value)}
					placeholder="or describe what you want to write..."
					className="resize-none h-12 text-xs"
				/>
				<Button onClick={runCustom} disabled={loading || !customPrompt.trim()} size="sm">
					go
				</Button>
			</div>

			{loading && (
				<p className="text-sm text-muted-foreground animate-pulse text-center">
					writing...
				</p>
			)}

			{output && (
				<Card>
					<CardHeader>
						<CardTitle className="text-xs">output</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-96">
							<pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
								{output}
							</pre>
						</ScrollArea>
						<Button
							variant="outline"
							size="sm"
							className="mt-3 text-xs w-full"
							onClick={() => navigator.clipboard.writeText(output)}
						>
							copy to clipboard
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
