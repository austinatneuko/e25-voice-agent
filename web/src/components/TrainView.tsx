import { useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Phase = 'ingest' | 'analyze' | 'interview' | 'done';

interface InterviewQuestion {
	id: string;
	question: string;
	stepName: string;
	required: boolean;
}

export function TrainView({ onComplete }: { onComplete: () => void }) {
	const [phase, setPhase] = useState<Phase>('ingest');
	const [text, setText] = useState('');
	const [substackUrl, setSubstackUrl] = useState('');
	const [xHandle, setXHandle] = useState('');
	const [sampleCount, setSampleCount] = useState(0);
	const [analysisSummary, setAnalysisSummary] = useState('');
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState('');

	// Interview state
	const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
	const [answer, setAnswer] = useState('');
	const [progress, setProgress] = useState({ answered: 0, total: 0, currentStepName: '' });
	const [completed, setCompleted] = useState(false);
	const [soulMdPreview, setSoulMdPreview] = useState('');

	async function ingestText() {
		if (!text.trim()) return;
		setLoading(true);
		try {
			await api.ingestText(text, 'pasted text');
			setSampleCount((c) => c + 1);
			setText('');
			setStatus('text ingested');
		} finally {
			setLoading(false);
		}
	}

	async function ingestSubstack() {
		if (!substackUrl.trim()) return;
		setLoading(true);
		setStatus('fetching substack...');
		try {
			const res = (await api.ingestSubstack(substackUrl)) as { ingested: number };
			setSampleCount((c) => c + res.ingested);
			setSubstackUrl('');
			setStatus(`${res.ingested} posts ingested`);
		} catch {
			setStatus('substack fetch failed');
		} finally {
			setLoading(false);
		}
	}

	async function ingestX() {
		if (!xHandle.trim()) return;
		setLoading(true);
		setStatus('fetching tweets...');
		try {
			const res = (await api.ingestX(xHandle)) as { ingested: number };
			setSampleCount((c) => c + res.ingested);
			setXHandle('');
			setStatus(`${res.ingested} tweets ingested`);
		} catch {
			setStatus('tweet fetch failed');
		} finally {
			setLoading(false);
		}
	}

	async function runAnalysis() {
		setLoading(true);
		setStatus('analyzing voice...');
		try {
			const res = await api.analyze();
			setAnalysisSummary(res.summary);
			setPhase('interview');
			// Start interview
			const iv = await api.interviewStart();
			setCurrentQuestion(iv.nextQuestion);
			setProgress(iv.progress);
			setStatus('');
		} catch {
			setStatus('analysis failed');
		} finally {
			setLoading(false);
		}
	}

	async function submitAnswer() {
		if (!currentQuestion || !answer.trim()) return;
		setLoading(true);
		try {
			const res = await api.interviewAnswer(currentQuestion.id, answer.trim());
			setAnswer('');
			setCurrentQuestion(res.nextQuestion);
			setProgress(res.progress);
			setCompleted(res.completed);
		} finally {
			setLoading(false);
		}
	}

	async function skipQuestion() {
		if (!currentQuestion) return;
		await api.interviewSkip(currentQuestion.id);
		const res = await api.interviewNext();
		setCurrentQuestion(res.question);
		setProgress(res.progress);
		setCompleted(res.completed);
	}

	async function buildProfile() {
		setLoading(true);
		try {
			const res = await api.buildProfile();
			setSoulMdPreview(res.soulMdPreview);
			setPhase('done');
		} finally {
			setLoading(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (phase === 'interview') submitAnswer();
		}
	}

	if (phase === 'done') {
		return (
			<div className="max-w-2xl mx-auto p-6 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>voice profile built</CardTitle>
						<CardDescription>your agent is ready to chat</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64 whitespace-pre-wrap">
							{soulMdPreview}...
						</pre>
						<Button onClick={onComplete} className="w-full">
							start chatting
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (phase === 'interview') {
		return (
			<div className="max-w-2xl mx-auto p-6 space-y-4">
				{analysisSummary && (
					<Card>
						<CardContent className="p-4">
							<p className="text-sm text-muted-foreground">{analysisSummary}</p>
						</CardContent>
					</Card>
				)}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">interview</CardTitle>
							<div className="flex items-center gap-2">
								<Badge variant="outline">{progress.currentStepName}</Badge>
								<span className="text-sm text-muted-foreground">
									{progress.answered}/{progress.total}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{completed ? (
							<div className="space-y-4">
								<p className="text-sm">interview complete. ready to build your voice profile.</p>
								<Button onClick={buildProfile} disabled={loading} className="w-full">
									{loading ? 'building...' : 'build voice profile'}
								</Button>
							</div>
						) : currentQuestion ? (
							<>
								<p className="text-sm font-medium">{currentQuestion.question}</p>
								<Textarea
									value={answer}
									onChange={(e) => setAnswer(e.target.value)}
									onKeyDown={handleKeyDown}
									placeholder="your answer..."
									className="resize-none"
									rows={3}
								/>
								<div className="flex gap-2">
									<Button onClick={submitAnswer} disabled={loading || !answer.trim()} className="flex-1">
										{loading ? 'saving...' : 'answer'}
									</Button>
									{!currentQuestion.required && (
										<Button variant="outline" onClick={skipQuestion}>
											skip
										</Button>
									)}
								</div>
							</>
						) : null}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>feed it your writing</CardTitle>
					<CardDescription>
						paste text, add a substack url, or pull tweets. the more samples the better.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Textarea
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="paste writing samples here..."
							rows={4}
							className="resize-none"
						/>
						<Button onClick={ingestText} disabled={loading || !text.trim()} variant="outline" className="w-full">
							add text
						</Button>
					</div>

					<Separator />

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

					<div className="flex gap-2">
						<Input
							value={xHandle}
							onChange={(e) => setXHandle(e.target.value)}
							placeholder="x handle (e.g. elonmusk)"
						/>
						<Button onClick={ingestX} disabled={loading || !xHandle.trim()} variant="outline">
							fetch
						</Button>
					</div>

					{status && (
						<p className="text-sm text-muted-foreground">{status}</p>
					)}

					{sampleCount > 0 && (
						<>
							<Separator />
							<div className="flex items-center justify-between">
								<span className="text-sm">
									{sampleCount} sample{sampleCount > 1 ? 's' : ''} loaded
								</span>
								<Button onClick={runAnalysis} disabled={loading}>
									{loading ? 'analyzing...' : 'analyze & start interview'}
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
