import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
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
}

export function ChatView() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [correcting, setCorrecting] = useState<number | null>(null);
	const [correction, setCorrection] = useState('');
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

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
		await api.feedback(correction.trim());
		setMessages((prev) =>
			prev.map((m, i) =>
				i === idx ? { ...m, content: m.content + '\n\n[corrected: ' + correction + ']' } : m,
			),
		);
		setCorrection('');
		setCorrecting(null);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)]">
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-4 max-w-2xl mx-auto">
					{messages.length === 0 && (
						<p className="text-muted-foreground text-center py-12">
							start chatting with your trained voice agent
						</p>
					)}
					{messages.map((msg, i) => (
						<div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
							{msg.role === 'assistant' && (
								<Avatar className="h-8 w-8 shrink-0">
									<AvatarFallback className="bg-primary text-primary-foreground text-xs">
										VA
									</AvatarFallback>
								</Avatar>
							)}
							<div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
								<Card
									className={
										msg.role === 'user'
											? 'bg-primary text-primary-foreground'
											: 'bg-muted'
									}
								>
									<CardContent className="p-3">
										<p className="text-sm whitespace-pre-wrap">{msg.content}</p>
									</CardContent>
								</Card>
								{msg.role === 'assistant' && msg.plan && (
									<div className="flex gap-1 mt-1 flex-wrap">
										<Badge variant="outline" className="text-[10px]">
											{msg.plan.socialMove}
										</Badge>
										<Badge variant="outline" className="text-[10px]">
											{msg.plan.toneGuidance}
										</Badge>
									</div>
								)}
								{msg.role === 'assistant' && (
									<div className="mt-1">
										{correcting === i ? (
											<div className="flex gap-2 items-end">
												<Textarea
													value={correction}
													onChange={(e) => setCorrection(e.target.value)}
													placeholder="what felt off?"
													className="text-xs h-16"
												/>
												<div className="flex flex-col gap-1">
													<Button size="sm" variant="outline" onClick={() => submitCorrection(i)}>
														save
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => setCorrecting(null)}
													>
														cancel
													</Button>
												</div>
											</div>
										) : (
											<Button
												size="sm"
												variant="ghost"
												className="text-xs text-muted-foreground h-6 px-2"
												onClick={() => setCorrecting(i)}
											>
												didn't sound right?
											</Button>
										)}
									</div>
								)}
							</div>
							{msg.role === 'user' && (
								<Avatar className="h-8 w-8 shrink-0">
									<AvatarFallback className="text-xs">U</AvatarFallback>
								</Avatar>
							)}
						</div>
					))}
					{loading && (
						<div className="flex gap-3">
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs">
									VA
								</AvatarFallback>
							</Avatar>
							<Card className="bg-muted">
								<CardContent className="p-3">
									<p className="text-sm text-muted-foreground animate-pulse">thinking...</p>
								</CardContent>
							</Card>
						</div>
					)}
					<div ref={scrollRef} />
				</div>
			</ScrollArea>
			<div className="border-t p-4">
				<div className="flex gap-2 max-w-2xl mx-auto">
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="say something..."
						className="resize-none h-12"
						disabled={loading}
					/>
					<Button onClick={send} disabled={loading || !input.trim()}>
						send
					</Button>
				</div>
			</div>
		</div>
	);
}
