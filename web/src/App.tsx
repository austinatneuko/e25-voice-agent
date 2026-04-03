import { useCallback, useState } from 'react';
import type { AnalysisResult, InterviewProgress, InterviewQuestion, SamplePreview } from '@/lib/api';
import { api } from '@/lib/api';
import { ChatView } from '@/components/ChatView';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { InterviewStep } from '@/components/steps/InterviewStep';
import { SoulPanel } from '@/components/SoulPanel';
import { SoulSprite, type SpriteState } from '@/components/SoulSprite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type AppStep = 'ingest' | 'analysis' | 'interview' | 'chat';

function App() {
	const [step, setStep] = useState<AppStep>('ingest');
	const [soulMd, setSoulMd] = useState('');
	const [spriteState, setSpriteState] = useState<SpriteState>('idle');

	// Ingest
	const [samples, setSamples] = useState<SamplePreview[]>([]);
	const [text, setText] = useState('');
	const [substackUrl, setSubstackUrl] = useState('');
	const [xHandle, setXHandle] = useState('');
	const [loading, setLoading] = useState(false);
	const [loadingMsg, setLoadingMsg] = useState('');
	const [error, setError] = useState('');

	// Analysis
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
	const [antiPatterns, setAntiPatterns] = useState<
		Array<{ pattern: string; reason: string; example?: string }>
	>([]);

	// Interview
	const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
	const [progress, setProgress] = useState<InterviewProgress>({
		answered: 0,
		total: 0,
		currentStepName: '',
	});

	const refreshSamples = useCallback(async () => {
		const res = await api.getSamples();
		setSamples(res.samples);
	}, []);

	const refreshSoul = useCallback(async () => {
		const md = await api.soulMd();
		if (md) setSoulMd(md);
	}, []);

	// === Ingest actions ===
	async function ingestText() {
		if (!text.trim()) return;
		setLoading(true);
		setError('');
		try {
			await api.ingestText(text, 'pasted text');
			setText('');
			await refreshSamples();
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
			await refreshSamples();
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
			await refreshSamples();
		} catch (e) {
			setError(`tweet fetch failed: ${e}`);
		} finally {
			setLoading(false);
			setLoadingMsg('');
			setSpriteState('idle');
		}
	}

	async function handleAnalyze() {
		setLoading(true);
		setLoadingMsg('analyzing voice (10-20s)...');
		setSpriteState('reading');
		setError('');
		try {
			const res = await api.analyze();
			setAnalysis(res);
			try {
				const wp = await api.getWritingProfile();
				setAntiPatterns(wp.antiPatterns);
			} catch { /* ignore */ }
			const iv = await api.interviewStart();
			setCurrentQuestion(iv.nextQuestion);
			setProgress(iv.progress);
			if (iv.soulMd) setSoulMd(iv.soulMd);
			setSpriteState('idle');
			setStep('analysis');
		} catch (e) {
			setError(`analysis failed: ${e}`);
			setSpriteState('idle');
		} finally {
			setLoading(false);
			setLoadingMsg('');
		}
	}

	async function onSkipToChat() {
		setSpriteState('writing');
		await api.buildProfile();
		await refreshSoul();
		setSpriteState('idle');
		setStep('chat');
	}

	async function onInterviewAnswer(questionId: string, answer: string) {
		setSpriteState('writing');
		const res = await api.interviewAnswer(questionId, answer);
		setCurrentQuestion(res.nextQuestion);
		setProgress(res.progress);
		if (res.soulMd) setSoulMd(res.soulMd);
		setSpriteState('listening');
	}

	async function onInterviewSkip(questionId: string) {
		const res = await api.interviewSkip(questionId);
		setCurrentQuestion(res.nextQuestion);
		setProgress(res.progress);
	}

	const showSoul = soulMd.length > 0;

	// === INGEST (home page — sources + data entry in one) ===
	if (step === 'ingest') {
		return (
			<Shell>
				<div className="max-w-2xl mx-auto p-6 space-y-4">
					<div className="text-center space-y-2 py-4">
						<SoulSprite state={spriteState} size="lg" />
						<h1 className="text-xl font-semibold tracking-tight">voice agent trainer</h1>
						<p className="text-sm text-muted-foreground">
							feed it your writing to learn your voice
						</p>
					</div>

					{/* Paste text */}
					<Card>
						<CardHeader><CardTitle className="text-sm">paste text</CardTitle></CardHeader>
						<CardContent className="space-y-2">
							<Textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="tweets, blog posts, messages — anything that sounds like you..."
								rows={3}
								className="resize-none"
							/>
							<Button onClick={ingestText} disabled={loading || !text.trim()} variant="outline" size="sm" className="w-full">
								add
							</Button>
						</CardContent>
					</Card>

					{/* Substack */}
					<Card>
						<CardContent className="p-4">
							<div className="flex gap-2 items-center">
								<span className="text-sm font-medium shrink-0">substack</span>
								<Input
									value={substackUrl}
									onChange={(e) => setSubstackUrl(e.target.value)}
									placeholder="yourname.substack.com"
									className="flex-1"
								/>
								<Button onClick={ingestSubstack} disabled={loading || !substackUrl.trim()} variant="outline" size="sm">
									fetch
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* X / Twitter */}
					<Card>
						<CardContent className="p-4">
							<div className="flex gap-2 items-center">
								<span className="text-sm font-medium shrink-0">x / twitter</span>
								<Input
									value={xHandle}
									onChange={(e) => setXHandle(e.target.value)}
									placeholder="@handle"
									className="flex-1"
								/>
								<Button onClick={ingestX} disabled={loading || !xHandle.trim()} variant="outline" size="sm">
									fetch
								</Button>
							</div>
						</CardContent>
					</Card>

					{loadingMsg && <p className="text-sm text-muted-foreground animate-pulse text-center">{loadingMsg}</p>}
					{error && <p className="text-sm text-destructive text-center">{error}</p>}

					{/* Sample preview */}
					{samples.length > 0 && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-sm">
										{samples.length} sample{samples.length > 1 ? 's' : ''} loaded
									</CardTitle>
									<span className="text-xs text-muted-foreground">
										{samples.reduce((sum, s) => sum + s.wordCount, 0)} words
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<ScrollArea className="max-h-48">
									<div className="space-y-2">
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
						<Button onClick={handleAnalyze} disabled={loading} className="w-full" size="lg">
							{loading ? loadingMsg || 'loading...' : `analyze ${samples.length} samples`}
						</Button>
					)}
				</div>
			</Shell>
		);
	}

	// === ANALYSIS ===
	if (step === 'analysis') {
		return (
			<Shell>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<AnalysisStep
						analysis={analysis}
						antiPatterns={antiPatterns}
						onStartInterview={() => { setStep('interview'); setSpriteState('listening'); }}
						onSkipToChat={onSkipToChat}
					/>
					{showSoul && <SoulPanel soulMd={soulMd} spriteState={spriteState} label="from writing analysis" />}
				</div>
			</Shell>
		);
	}

	// === INTERVIEW ===
	if (step === 'interview') {
		return (
			<Shell>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<InterviewStep
						question={currentQuestion}
						progress={progress}
						onAnswer={onInterviewAnswer}
						onSkip={onInterviewSkip}
						onSkipToChat={onSkipToChat}
						spriteState={spriteState}
					/>
					{showSoul && <SoulPanel soulMd={soulMd} spriteState={spriteState} label={`updating — ${progress.answered} answers`} />}
				</div>
			</Shell>
		);
	}

	// === CHAT + SOUL ===
	return (
		<Shell>
			<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
				<div className="min-h-0 border-r">
					<ChatView onCorrection={refreshSoul} />
				</div>
				<SoulPanel soulMd={soulMd} spriteState={spriteState} label="live" />
			</div>
		</Shell>
	);
}

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b px-6 py-2.5 shrink-0">
				<span className="text-xs font-medium tracking-tight text-muted-foreground">
					voice agent trainer
				</span>
			</header>
			{children}
		</div>
	);
}

export default App;
