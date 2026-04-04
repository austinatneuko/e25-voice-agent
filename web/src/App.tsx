import { useCallback, useState } from 'react';
import type { AnalysisResult, InterviewProgress, InterviewQuestion, SamplePreview } from '@/lib/api';
import { api } from '@/lib/api';
import { ActionsPanel } from '@/components/ActionsPanel';
import { ChatView } from '@/components/ChatView';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { InterviewStep } from '@/components/steps/InterviewStep';
import { SoulPanel } from '@/components/SoulPanel';
import { DittoSprite, type DittoState } from '@/components/DittoSprite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

type AppStep = 'persona' | 'pick' | 'ingest' | 'analysis' | 'interview' | 'chat';
type ChatMode = 'chat' | 'interview' | 'actions';

interface PersonaInfo {
	id: string;
	name: string;
	active: boolean;
}

function App() {
	const [step, setStep] = useState<AppStep>('persona');
	const [chatMode, setChatMode] = useState<ChatMode>('chat');
	const [soulMd, setSoulMd] = useState('');
	const [spriteState, setSpriteState] = useState<DittoState>('idle' as DittoState);
	const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
	const [personas, setPersonas] = useState<PersonaInfo[]>([]);
	const [personaName, setPersonaName] = useState('');
	const [activePersonaName, setActivePersonaName] = useState('');

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
		setLoadingMsg(`fetching tweets from @${xHandle.replace('@', '')}...`);
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

	const toggleSource = (s: string) => {
		setSelectedSources((prev) => {
			const next = new Set(prev);
			if (next.has(s)) next.delete(s);
			else next.add(s);
			return next;
		});
	};

	const showSoul = soulMd.length > 0;

	const samplesBySource = samples.reduce<Record<string, SamplePreview[]>>((acc, s) => {
		const key = s.source;
		if (!acc[key]) acc[key] = [];
		acc[key].push(s);
		return acc;
	}, {});

	async function loadPersonas() {
		try {
			const res = await api.listPersonas();
			setPersonas(res.personas);
		} catch { /* ignore */ }
	}

	async function handleCreatePersona() {
		if (!personaName.trim()) return;
		await api.createPersona(personaName.trim());
		setActivePersonaName(personaName.trim());
		setPersonaName('');
		setStep('pick');
	}

	async function handleSwitchPersona(id: string, name: string) {
		await api.switchPersona(id);
		setActivePersonaName(name);
		// Reset frontend state for this persona
		setSamples([]);
		setSoulMd('');
		setAnalysis(null);
		setAntiPatterns([]);
		setCurrentQuestion(null);
		// Check if this persona already has data
		await refreshSamples();
		const soul = await api.soulMd();
		if (soul) {
			setSoulMd(soul);
			setStep('chat');
		} else if (samples.length > 0) {
			setStep('ingest');
		} else {
			setStep('pick');
		}
	}

	async function handleClearSamples() {
		await api.clearSamples();
		setSamples([]);
		setAnalysis(null);
		setAntiPatterns([]);
	}

	// === PERSONA SELECTION ===
	if (step === 'persona') {
		// Load personas on first render
		if (personas.length === 0) {
			loadPersonas();
		}

		return (
			<Shell>
				<div className="max-w-md mx-auto p-8 space-y-8">
					<div className="text-center space-y-4 py-8">
						<DittoSprite state="idle" size={96} />
						<h1 className="text-3xl font-bold tracking-tight">
							<span className="ditto-text">ditto</span>
						</h1>
						<p className="text-sm text-muted-foreground leading-relaxed">
							an agent that actually, finally, sounds like you.
						</p>
					</div>

					{/* Create new persona */}
					<Card className="ditto-card">
						<CardContent className="p-4 space-y-3">
							<p className="text-sm font-medium">create a new persona</p>
							<div className="flex gap-2">
								<Input
									value={personaName}
									onChange={(e) => setPersonaName(e.target.value)}
									placeholder="your name"
									onKeyDown={(e) => e.key === 'Enter' && handleCreatePersona()}
								/>
								<Button onClick={handleCreatePersona} disabled={!personaName.trim()}>
									create
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Existing personas */}
					{personas.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
								your personas
							</p>
							{personas.map((p) => (
								<button
									key={p.id}
									onClick={() => handleSwitchPersona(p.id, p.name)}
									className="w-full border rounded-lg p-3 text-left transition-all hover:border-[var(--ditto)] hover:bg-[var(--ditto-soft)]/10 ditto-card flex items-center justify-between"
								>
									<span className="font-medium text-sm">{p.name}</span>
									{p.active && (
										<Badge variant="outline" style={{ borderColor: 'var(--ditto)', color: 'var(--ditto)' }} className="text-[10px]">
											active
										</Badge>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			</Shell>
		);
	}

	// === SOURCE PICKER ===
	if (step === 'pick') {
		return (
			<Shell personaName={activePersonaName} onSwitchPersona={() => setStep("persona")}>
				<div className="max-w-lg mx-auto p-8 space-y-6">
					<div className="text-center space-y-2 pt-4">
						<p className="text-sm text-muted-foreground">
							training <span className="font-medium" style={{ color: 'var(--ditto)' }}>{activePersonaName}</span>
						</p>
						<p className="text-xs text-muted-foreground">
							how do you want to teach it your voice?
						</p>
					</div>
					<div className="grid grid-cols-1 gap-3">
						{[
							{ id: 'text', label: 'paste text', desc: 'blog posts, emails, messages, notes' },
							{ id: 'substack', label: 'substack', desc: 'import posts from your RSS feed' },
							{ id: 'x', label: 'x / twitter', desc: 'pull your recent tweets' },
						].map((s) => (
							<button
								key={s.id}
								onClick={() => toggleSource(s.id)}
								className={`border rounded-lg p-4 text-left transition-all ${
									selectedSources.has(s.id)
										? 'border-primary bg-primary/5 ring-1 ring-primary'
										: 'border-border hover:border-primary/50'
								}`}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-sm">{s.label}</div>
										<div className="text-xs text-muted-foreground">{s.desc}</div>
									</div>
									{selectedSources.has(s.id) && (
										<span className="text-primary text-lg">✓</span>
									)}
								</div>
							</button>
						))}
					</div>
					{selectedSources.size > 0 && (
						<Button onClick={() => setStep('ingest')} className="w-full" size="lg">
							continue
						</Button>
					)}
				</div>
			</Shell>
		);
	}

	// === INGEST (only shows selected sources) ===
	if (step === 'ingest') {
		return (
			<Shell personaName={activePersonaName} onSwitchPersona={() => setStep("persona")}>
				<div className="max-w-2xl mx-auto p-6 space-y-4">
					{selectedSources.has('text') && (
						<Card>
							<CardHeader><CardTitle className="text-sm">paste your writing</CardTitle></CardHeader>
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
					)}

					{selectedSources.has('substack') && (
						<Card>
							<CardHeader><CardTitle className="text-sm">substack</CardTitle></CardHeader>
							<CardContent>
								<div className="flex gap-2">
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
					)}

					{selectedSources.has('x') && (
						<Card>
							<CardHeader><CardTitle className="text-sm">x / twitter</CardTitle></CardHeader>
							<CardContent>
								<div className="flex gap-2">
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
								<p className="text-[10px] text-muted-foreground mt-2">
									you can fetch multiple handles — all tweets are combined for analysis
								</p>
							</CardContent>
						</Card>
					)}

					{loadingMsg && <p className="text-sm text-muted-foreground animate-pulse text-center">{loadingMsg}</p>}
					{error && <p className="text-sm text-destructive text-center">{error}</p>}

					{/* Sample preview grouped by source */}
					{samples.length > 0 && (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-sm">
										{samples.length} sample{samples.length > 1 ? 's' : ''} loaded
									</CardTitle>
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">
											{samples.reduce((sum, s) => sum + s.wordCount, 0)}w
										</span>
										<Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-destructive" onClick={handleClearSamples}>
											clear all
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<ScrollArea className="max-h-56">
									<div className="space-y-4">
										{Object.entries(samplesBySource).map(([source, items]) => (
											<div key={source}>
												<div className="flex items-center gap-2 mb-2">
													<Badge variant="secondary" className="text-[10px]">{source}</Badge>
													<span className="text-[10px] text-muted-foreground">
														{items.length} sample{items.length > 1 ? 's' : ''} · {items.reduce((s, i) => s + i.wordCount, 0)}w
													</span>
												</div>
												<div className="space-y-2 pl-2 border-l-2 border-muted">
													{items.map((s, i) => (
														<div key={i}>
															{s.title && <span className="text-xs font-medium">{s.title} </span>}
															<p className="text-xs text-muted-foreground leading-relaxed">{s.preview}</p>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					)}

					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setStep('pick')}>
							← back
						</Button>
						{samples.length > 0 && (
							<Button onClick={handleAnalyze} disabled={loading} className="flex-1" size="lg">
								{loading ? loadingMsg || 'loading...' : `analyze all ${samples.length} samples`}
							</Button>
						)}
					</div>
				</div>
			</Shell>
		);
	}

	// === ANALYSIS ===
	if (step === 'analysis') {
		return (
			<Shell personaName={activePersonaName} onSwitchPersona={() => setStep("persona")}>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<AnalysisStep
						analysis={analysis}
						antiPatterns={antiPatterns}
						onStartInterview={() => { setStep('interview'); setSpriteState('listening'); }}
						onSkipToChat={onSkipToChat}
					/>
					{showSoul && <SoulPanel soulMd={soulMd} spriteState={spriteState} label="from writing analysis" analysisData={analysis} />}
				</div>
			</Shell>
		);
	}

	// === INTERVIEW ===
	if (step === 'interview') {
		return (
			<Shell personaName={activePersonaName} onSwitchPersona={() => setStep("persona")}>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<InterviewStep
						question={currentQuestion}
						progress={progress}
						onAnswer={onInterviewAnswer}
						onSkip={onInterviewSkip}
						onSkipToChat={onSkipToChat}
						spriteState={spriteState}
					/>
					{showSoul && <SoulPanel soulMd={soulMd} spriteState={spriteState} label={`updating — ${progress.answered} answers`} analysisData={analysis} />}
				</div>
			</Shell>
		);
	}

	// === CHAT / INTERVIEW / ACTIONS + SOUL ===
	return (
		<Shell personaName={activePersonaName} onSwitchPersona={() => setStep("persona")}>
			{/* Mode tabs */}
			<div className="border-b px-6 flex items-center gap-1 shrink-0">
				{[
					{ id: 'chat' as ChatMode, label: 'chat' },
					{ id: 'interview' as ChatMode, label: 'interview' },
					{ id: 'actions' as ChatMode, label: 'create' },
				].map((m) => (
					<button
						key={m.id}
						onClick={() => setChatMode(m.id)}
						className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
							chatMode === m.id
								? 'border-primary text-foreground'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						{m.label}
					</button>
				))}
			</div>
			<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
				<div className="min-h-0 border-r">
					{chatMode === 'chat' && (
						<ChatView
							onCorrection={(newSoulMd) => {
								setSoulMd(newSoulMd);
							}}
						/>
					)}
					{chatMode === 'interview' && (
						<InterviewStep
							question={currentQuestion}
							progress={progress}
							onAnswer={onInterviewAnswer}
							onSkip={onInterviewSkip}
							onSkipToChat={() => setChatMode('chat')}
							spriteState={spriteState}
						/>
					)}
					{chatMode === 'actions' && <ActionsPanel />}
				</div>
				<SoulPanel
					soulMd={soulMd}
					spriteState={spriteState}
					label={chatMode === 'interview' ? `updating — ${progress.answered} answers` : 'live'}
					analysisData={analysis}
				/>
			</div>
		</Shell>
	);
}

function Shell({ children, personaName, onSwitchPersona }: { children: React.ReactNode; personaName?: string; onSwitchPersona?: () => void; }) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b px-6 py-2.5 shrink-0 flex items-center justify-between">
				<span className="text-sm font-bold tracking-tight ditto-text">
					ditto
				</span>
				{personaName && (
					<button
						onClick={onSwitchPersona}
						className="text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						{personaName} ↗
					</button>
				)}
			</header>
			{children}
		</div>
	);
}

export default App;
