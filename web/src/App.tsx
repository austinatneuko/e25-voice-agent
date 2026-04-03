import { useCallback, useState } from 'react';
import type { AnalysisResult, InterviewProgress, InterviewQuestion, SamplePreview } from '@/lib/api';
import { api } from '@/lib/api';
import { ChatView } from '@/components/ChatView';
import { IngestStep } from '@/components/steps/IngestStep';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { InterviewStep } from '@/components/steps/InterviewStep';
import { SoulPanel } from '@/components/SoulPanel';
import type { SpriteState } from '@/components/SoulSprite';

type AppStep = 'sources' | 'ingest' | 'analysis' | 'interview' | 'chat';

function App() {
	const [step, setStep] = useState<AppStep>('sources');
	const [soulMd, setSoulMd] = useState('');
	const [spriteState, setSpriteState] = useState<SpriteState>('idle');
	const [soulVersion, setSoulVersion] = useState(0);

	// Source selection
	const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

	// Ingest state
	const [samples, setSamples] = useState<SamplePreview[]>([]);

	// Analysis state
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
	const [antiPatterns, setAntiPatterns] = useState<
		Array<{ pattern: string; reason: string; example?: string }>
	>([]);

	// Interview state
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
		setSoulVersion((v) => v + 1);
	}, []);

	async function onAnalyze() {
		setSpriteState('reading');
		const res = await api.analyze();
		setAnalysis(res);
		// Fetch anti-patterns detail
		try {
			const wp = await api.getWritingProfile();
			setAntiPatterns(wp.antiPatterns);
		} catch {
			// ignore
		}
		// Start interview + build initial soul from writing
		const iv = await api.interviewStart();
		setCurrentQuestion(iv.nextQuestion);
		setProgress(iv.progress);
		if (iv.soulMd) setSoulMd(iv.soulMd);
		setSpriteState('idle');
		setStep('analysis');
	}

	async function onStartInterview() {
		setStep('interview');
		setSpriteState('listening');
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
		setSoulVersion((v) => v + 1);
	}

	async function onInterviewSkip(questionId: string) {
		const res = await api.interviewSkip(questionId);
		setCurrentQuestion(res.nextQuestion);
		setProgress(res.progress);
	}

	function onCorrection() {
		refreshSoul();
	}

	const toggleSource = (s: string) => {
		setSelectedSources((prev) => {
			const next = new Set(prev);
			if (next.has(s)) next.delete(s);
			else next.add(s);
			return next;
		});
	};

	// Show soul panel once we have content
	const showSoul = soulMd.length > 0;

	// === SOURCE SELECTION ===
	if (step === 'sources') {
		return (
			<Shell>
				<div className="max-w-lg mx-auto p-8 space-y-6">
					<div className="text-center space-y-2">
						<h1 className="text-2xl font-semibold tracking-tight">voice agent trainer</h1>
						<p className="text-sm text-muted-foreground">
							choose your training sources
						</p>
					</div>
					<div className="grid grid-cols-1 gap-3">
						{[
							{ id: 'text', label: 'paste text', desc: 'blog posts, emails, messages' },
							{ id: 'substack', label: 'substack', desc: 'import from RSS feed' },
							{ id: 'x', label: 'x / twitter', desc: 'pull recent tweets' },
						].map((s) => (
							<button
								key={s.id}
								onClick={() => toggleSource(s.id)}
								className={`border rounded-lg p-4 text-left transition-colors ${
									selectedSources.has(s.id)
										? 'border-primary bg-primary/5'
										: 'border-border hover:border-primary/50'
								}`}
							>
								<div className="font-medium text-sm">{s.label}</div>
								<div className="text-xs text-muted-foreground">{s.desc}</div>
							</button>
						))}
					</div>
					{selectedSources.size > 0 && (
						<button
							onClick={() => setStep('ingest')}
							className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90"
						>
							continue with {selectedSources.size} source{selectedSources.size > 1 ? 's' : ''}
						</button>
					)}
				</div>
			</Shell>
		);
	}

	// === INGEST ===
	if (step === 'ingest') {
		return (
			<Shell>
				<IngestStep
					sources={selectedSources}
					samples={samples}
					onRefreshSamples={refreshSamples}
					onAnalyze={onAnalyze}
					spriteState={spriteState}
					setSpriteState={setSpriteState}
				/>
			</Shell>
		);
	}

	// === ANALYSIS RESULTS ===
	if (step === 'analysis') {
		return (
			<Shell>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<AnalysisStep
						analysis={analysis}
						antiPatterns={antiPatterns}
						onStartInterview={onStartInterview}
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

	// === CHAT + SOUL SIDE BY SIDE ===
	return (
		<Shell>
			<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
				<div className="min-h-0 border-r">
					<ChatView onCorrection={onCorrection} />
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
