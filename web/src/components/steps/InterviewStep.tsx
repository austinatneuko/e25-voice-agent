import { useEffect, useState } from 'react';
import type { InterviewProgress, InterviewQuestion } from '@/lib/api';
import { useVoiceInput } from '@/lib/use-voice-input';
import { type SpriteState, SoulSprite } from '@/components/SoulSprite';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Props {
	question: InterviewQuestion | null;
	progress: InterviewProgress;
	onAnswer: (questionId: string, answer: string) => Promise<void>;
	onSkip: (questionId: string) => void;
	onSkipToChat: () => void;
	spriteState: SpriteState;
}

export function InterviewStep({
	question,
	progress,
	onAnswer,
	onSkip,
	onSkipToChat,
	spriteState,
}: Props) {
	const [answer, setAnswer] = useState('');
	const [loading, setLoading] = useState(false);
	const voice = useVoiceInput();

	// Sync voice transcript to answer field
	useEffect(() => {
		if (voice.transcript) setAnswer(voice.transcript);
	}, [voice.transcript]);

	async function submit() {
		if (!question || !answer.trim()) return;
		setLoading(true);
		await onAnswer(question.id, answer.trim());
		setAnswer('');
		setLoading(false);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}

	return (
		<div className="p-6 space-y-4 overflow-auto">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<SoulSprite state={spriteState} size="sm" />
					<div>
						<div className="flex items-center gap-2">
							<Badge variant="outline">{progress.currentStepName}</Badge>
							<span className="text-xs text-muted-foreground">
								{progress.answered}/{progress.total}
							</span>
						</div>
					</div>
				</div>
				<Button variant="ghost" size="sm" onClick={onSkipToChat} className="text-xs">
					skip to chat →
				</Button>
			</div>

			{question ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium leading-relaxed">
							{question.question}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="your answer..."
							className="resize-none"
							rows={3}
						/>
						<div className="flex gap-2">
							<Button onClick={submit} disabled={loading || !answer.trim()} className="flex-1">
								{loading ? 'saving...' : 'answer'}
							</Button>
							<Button variant="outline" onClick={() => onSkip(question.id)}>
								skip
							</Button>
							{voice.supported && (
								<Button
									variant={voice.listening ? 'destructive' : 'outline'}
									onClick={voice.listening ? voice.stop : voice.start}
									className="shrink-0"
								>
									{voice.listening ? '⏹ stop' : '🎤 voice'}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-6 text-center space-y-4">
						<p className="text-sm">interview complete</p>
						<Button onClick={onSkipToChat} className="w-full">
							start chatting
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
