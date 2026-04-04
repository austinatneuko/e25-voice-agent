import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useVoiceInput } from '@/lib/use-voice-input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	plan?: { goal: string; socialMove: string; toneGuidance: string };
	corrected?: boolean;
	approved?: boolean;
}

export function ChatView({
	onCorrection,
}: { onCorrection?: (newSoulMd: string) => void }) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [correcting, setCorrecting] = useState<number | null>(null);
	const [correction, setCorrection] = useState('');
	const [lessons, setLessons] = useState<Array<{ type: string; content: string }>>([]);
	const [showLessons, setShowLessons] = useState(false);
	const [ttsEnabled, setTtsEnabled] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const voice = useVoiceInput();

	// Only auto-scroll the chat container, not the page
	function scrollToBottom() {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	useEffect(() => {
		scrollToBottom();
	}, [messages, loading]);

	useEffect(() => {
		if (voice.transcript) setInput(voice.transcript);
	}, [voice.transcript]);

	async function send() {
		if (!input.trim() || loading) return;
		const msg = input.trim();
		setInput('');
		setMessages((prev) => [...prev, { role: 'user', content: msg }]);
		setLoading(true);

		try {
			const res = await api.chat(msg);
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: res.response, plan: res.plan },
			]);
			if (ttsEnabled) {
				const audio = await api.tts(res.response);
				audio?.play();
			}
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: '(error — server unreachable)' },
			]);
		} finally {
			setLoading(false);
		}
	}

	async function submitCorrection(idx: number) {
		if (!correction.trim()) return;
		const res = await api.feedback(correction.trim());
		setLessons((prev) => [...prev, { type: 'correction', content: correction.trim() }]);
		setMessages((prev) =>
			prev.map((m, i) => (i === idx ? { ...m, corrected: true } : m)),
		);
		setCorrection('');
		setCorrecting(null);
		if (res.soulMd) onCorrection?.(res.soulMd);
	}

	async function approveMessage(idx: number) {
		const msg = messages[idx];
		if (!msg || msg.role !== 'assistant') return;
		const res = await api.approve(msg.content);
		setLessons((prev) => [...prev, { type: 'approval', content: msg.content }]);
		setMessages((prev) =>
			prev.map((m, i) => (i === idx ? { ...m, approved: true } : m)),
		);
		if (res.soulMd) onCorrection?.(res.soulMd);
	}

	async function regenerate(idx: number) {
		let userMsg = '';
		for (let i = idx - 1; i >= 0; i--) {
			if (messages[i].role === 'user') {
				userMsg = messages[i].content;
				break;
			}
		}
		if (!userMsg) return;
		setLoading(true);
		try {
			const res = await api.chat(userMsg);
			setMessages((prev) =>
				prev.map((m, i) =>
					i === idx
						? { role: 'assistant', content: res.response, plan: res.plan }
						: m,
				),
			);
		} finally {
			setLoading(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	return (
		<div className="flex flex-col h-[calc(100vh-5.5rem)]">
			{/* Lessons drawer */}
			{showLessons && (
				<div className="border-b bg-muted/50 shrink-0 max-h-48 overflow-auto">
					<div className="max-w-2xl mx-auto p-3">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-medium">
								{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} learned
							</span>
							<Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setShowLessons(false)}>
								close
							</Button>
						</div>
						{lessons.length === 0 ? (
							<p className="text-xs text-muted-foreground">
								no lessons yet — thumbs up or correct responses to teach it
							</p>
						) : (
							<div className="space-y-1">
								{lessons.map((l, i) => (
									<div key={i} className="text-xs flex gap-2">
										<span className="shrink-0">{l.type === 'correction' ? '✕' : '✓'}</span>
										<span className={l.type === 'approval' ? 'text-green-700' : ''}>
											{l.type === 'approval' ? `"${l.content.slice(0, 80)}${l.content.length > 80 ? '...' : ''}"` : l.content}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			<ScrollArea className="flex-1" ref={scrollAreaRef}>
				<div className="p-4 space-y-4 max-w-2xl mx-auto">
					{messages.length === 0 && (
						<p className="text-muted-foreground text-center py-12 text-sm">
							talk to your agent — corrections and approvals update the soul in real time
						</p>
					)}
					{messages.map((msg, i) => (
						<div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
							{msg.role === 'assistant' && (
								<Avatar className="h-8 w-8 shrink-0">
									<AvatarFallback className="bg-primary text-primary-foreground text-xs">VA</AvatarFallback>
								</Avatar>
							)}
							<div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
								<Card className={`${
									msg.role === 'user'
										? 'bg-primary text-primary-foreground'
										: msg.corrected
											? 'bg-muted border-destructive/30'
											: msg.approved
												? 'bg-muted border-green-400/30'
												: 'bg-muted'
								}`}>
									<CardContent className="p-3">
										<p className={`text-sm whitespace-pre-wrap ${msg.corrected ? 'line-through opacity-50' : ''}`}>
											{msg.content}
										</p>
										{msg.approved && (
											<span className="text-[10px] text-green-600 mt-1 block">saved as good example</span>
										)}
									</CardContent>
								</Card>
								{msg.role === 'assistant' && msg.plan && !msg.corrected && (
									<div className="flex gap-1 mt-1 flex-wrap">
										<Badge variant="outline" className="text-[10px]">{msg.plan.socialMove}</Badge>
										<Badge variant="outline" className="text-[10px]">{msg.plan.toneGuidance}</Badge>
									</div>
								)}
								{msg.role === 'assistant' && !msg.approved && (
									<div className="mt-1 flex gap-1">
										{correcting === i ? (
											<div className="flex gap-2 items-end w-full">
												<Textarea
													value={correction}
													onChange={(e) => setCorrection(e.target.value)}
													placeholder="what felt off? this becomes a lesson..."
													className="text-xs h-16"
												/>
												<div className="flex flex-col gap-1">
													<Button size="sm" variant="outline" onClick={() => submitCorrection(i)}>save</Button>
													<Button size="sm" variant="ghost" onClick={() => setCorrecting(null)}>cancel</Button>
												</div>
											</div>
										) : msg.corrected ? (
											<Button size="sm" variant="outline" className="text-xs h-6 px-2" onClick={() => regenerate(i)} disabled={loading}>
												↻ regenerate with lesson
											</Button>
										) : (
											<div className="flex gap-1">
												<Button size="sm" variant="ghost" className="text-xs text-green-600 h-6 px-2" onClick={() => approveMessage(i)}>
													👍 sounds like me
												</Button>
												<Button size="sm" variant="ghost" className="text-xs text-muted-foreground h-6 px-2" onClick={() => setCorrecting(i)}>
													👎 not quite
												</Button>
											</div>
										)}
									</div>
								)}
							</div>
							{msg.role === 'user' && (
								<Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-xs">U</AvatarFallback></Avatar>
							)}
						</div>
					))}
					{loading && (
						<div className="flex gap-3">
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs">VA</AvatarFallback>
							</Avatar>
							<Card className="bg-muted">
								<CardContent className="p-3">
									<p className="text-sm text-muted-foreground animate-pulse">thinking...</p>
								</CardContent>
							</Card>
						</div>
					)}
					<div ref={bottomRef} />
				</div>
			</ScrollArea>

			<div className="border-t p-3 shrink-0">
				<div className="flex gap-2 max-w-2xl mx-auto">
					<Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => setShowLessons(!showLessons)}>
						{lessons.length > 0 ? `${lessons.length} lessons` : 'lessons'}
					</Button>
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="say something..."
						className="resize-none h-12"
						disabled={loading}
					/>
					{voice.supported && (
						<Button variant={voice.listening ? 'destructive' : 'outline'} onClick={voice.listening ? voice.stop : voice.start} className="shrink-0" size="sm">
							{voice.listening ? '⏹' : '🎤'}
						</Button>
					)}
					<Button variant={ttsEnabled ? 'default' : 'outline'} onClick={() => setTtsEnabled(!ttsEnabled)} className="shrink-0" size="sm">
						{ttsEnabled ? '🔊' : '🔇'}
					</Button>
					<Button onClick={send} disabled={loading || !input.trim()}>send</Button>
				</div>
			</div>
		</div>
	);
}
