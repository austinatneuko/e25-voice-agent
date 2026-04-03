import { useState } from 'react';
import {
	type AnalysisResult,
	type InterviewProgress,
	type InterviewQuestion,
	type SamplePreview,
	api,
} from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type Phase = 'ingest' | 'interview' | 'done';

export function TrainView({ onComplete }: { onComplete: () => void }) {
	const [phase, setPhase] = useState<Phase>('ingest');
	const [text, setText] = useState('');
	const [substackUrl, setSubstackUrl] = useState('');
	const [xHandle, setXHandle] = useState('');
	const [samples, setSamples] = useState<SamplePreview[]>([]);
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingAction, setLoadingAction] = useState('');
	const [error, setError] = useState('');

	// Interview state
	const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
	const [answer, setAnswer] = useState('');
	const [progress, setProgress] = useState<InterviewProgress>({
		answered: 0,
		total: 0,
		currentStepName: '',
	});
	const [completed, setCompleted] = useState(false);
	const [soulMdPreview, setSoulMdPreview] = useState('');

	async function refreshSamples() {
		try {
			const res = await api.getSamples();
			setSamples(res.samples);
		} catch {
			// ignore
		}
	}

	async function ingestText() {
		if (!text.trim()) return;
		setLoading(true);
		setLoadingAction('adding text...');
		setError('');
		try {
			const res = await api.ingestText(text, 'pasted text');
			setText('');
			await refreshSamples();
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
			setLoadingAction('');
		}
	}

	async function ingestSubstack() {
		if (!substackUrl.trim()) return;
		setLoading(true);
		setLoadingAction('fetching substack posts...');
		setError('');
		try {
			await api.ingestSubstack(substackUrl);
			setSubstackUrl('');
			await refreshSamples();
		} catch (e) {
			setError(`substack failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingAction('');
		}
	}

	async function ingestX() {
		if (!xHandle.trim()) return;
		setLoading(true);
		setLoadingAction('fetching tweets...');
		setError('');
		try {
			await api.ingestX(xHandle.replace('@', ''));
			setXHandle('');
			await refreshSamples();
		} catch (e) {
			setError(`tweet fetch failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingAction('');
		}
	}

	async function runAnalysis() {
		setLoading(true);
		setLoadingAction('analyzing voice (this takes 10-20s)...');
		setError('');
		try {
			const res = await api.analyze();
			setAnalysis(res);
			// Start interview
			const iv = await api.interviewStart();
			setCurrentQuestion(iv.nextQuestion);
			setProgress(iv.progress);
			setPhase('interview');
		} catch (e) {
			setError(`analysis failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingAction('');
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
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	}

	async function skipQuestion() {
		if (!currentQuestion) return;
		await api.interviewSkip(currentQuestion.id);
		const res = await api.interviewNext();
		setCurrentQuestion(res.question ?? res.nextQuestion);
		setProgress(res.progress);
		setCompleted(res.completed);
	}

	async function buildProfile() {
		setLoading(true);
		setLoadingAction('building voice profile...');
		try {
			const res = await api.buildProfile();
			setSoulMdPreview(res.soulMdPreview);
			setPhase('done');
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
			setLoadingAction('');
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (phase === 'interview') submitAnswer();
		}
	}

	// === DONE: show preview and launch button ===
	if (phase === 'done') {
		return (
			<div className="max-w-2xl mx-auto p-6 space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>voice profile built</CardTitle>
						<CardDescription>
							{samples.length} samples analyzed, {progress.answered} interview questions answered
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<ScrollArea className="h-64">
							<pre className="text-xs bg-muted p-4 rounded-md whitespace-pre-wrap">
								{soulMdPreview}...
							</pre>
						</ScrollArea>
						<Button onClick={onComplete} className="w-full">
							start chatting
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// === INTERVIEW ===
	if (phase === 'interview') {
		return (
			<div className="max-w-2xl mx-auto p-6 space-y-4">
				{analysis && (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">voice analysis</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm text-muted-foreground">{analysis.summary}</p>
							<div className="flex gap-2 flex-wrap">
								<Badge variant="outline">
									{analysis.antiPatterns} anti-patterns found
								</Badge>
								<Badge variant="outline">
									avg {analysis.styleMarkers.avgSentenceLength} words/sentence
								</Badge>
								{analysis.styleMarkers.usesAllLowercase && (
									<Badge variant="outline">all lowercase</Badge>
								)}
							</div>
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
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
						{completed ? (
							<div className="space-y-4">
								<p className="text-sm">
									interview complete. ready to build your voice profile.
								</p>
								<Button onClick={buildProfile} disabled={loading} className="w-full">
									{loading ? loadingAction : 'build voice profile'}
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
									<Button
										onClick={submitAnswer}
										disabled={loading || !answer.trim()}
										className="flex-1"
									>
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

	// === INGEST ===
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
						<Button
							onClick={ingestText}
							disabled={loading || !text.trim()}
							variant="outline"
							className="w-full"
						>
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
						<Button
							onClick={ingestSubstack}
							disabled={loading || !substackUrl.trim()}
							variant="outline"
						>
							fetch
						</Button>
					</div>

					<div className="flex gap-2">
						<Input
							value={xHandle}
							onChange={(e) => setXHandle(e.target.value)}
							placeholder="x handle (e.g. elonmusk)"
						/>
						<Button
							onClick={ingestX}
							disabled={loading || !xHandle.trim()}
							variant="outline"
						>
							fetch
						</Button>
					</div>

					{loading && loadingAction && (
						<p className="text-sm text-muted-foreground animate-pulse">{loadingAction}</p>
					)}
					{error && <p className="text-sm text-destructive">{error}</p>}
				</CardContent>
			</Card>

			{/* Sample preview */}
			{samples.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">
								{samples.length} sample{samples.length > 1 ? 's' : ''} ingested
							</CardTitle>
							<span className="text-xs text-muted-foreground">
								{samples.reduce((sum, s) => sum + s.wordCount, 0)} words total
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-64">
							<div className="space-y-3">
								{samples.map((s, i) => (
									<div key={i} className="border-b pb-2 last:border-0">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant="outline" className="text-[10px]">
												{s.source}
											</Badge>
											{s.title && (
												<span className="text-xs font-medium truncate">{s.title}</span>
											)}
											<span className="text-[10px] text-muted-foreground ml-auto">
												{s.wordCount}w
											</span>
										</div>
										<p className="text-xs text-muted-foreground leading-relaxed">
											{s.preview}
										</p>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			)}

			{samples.length > 0 && (
				<Button onClick={runAnalysis} disabled={loading} className="w-full" size="lg">
					{loading ? loadingAction : `analyze ${samples.length} samples & start interview`}
				</Button>
			)}
		</div>
	);
}
