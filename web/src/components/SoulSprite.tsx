export type SpriteState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

const SPRITES: Record<SpriteState, { emoji: string; label: string }> = {
	idle: { emoji: '🧘', label: 'resting' },
	reading: { emoji: '📖', label: 'reading your writing...' },
	writing: { emoji: '✍️', label: 'updating soul...' },
	listening: { emoji: '👂', label: 'listening...' },
	thinking: { emoji: '🤔', label: 'thinking...' },
	talking: { emoji: '💬', label: 'speaking...' },
};

export function SoulSprite({
	state,
	size = 'md',
}: { state: SpriteState; size?: 'sm' | 'md' | 'lg' }) {
	const sprite = SPRITES[state];
	const sizeClass = {
		sm: 'text-3xl',
		md: 'text-5xl',
		lg: 'text-7xl',
	}[size];

	return (
		<div className="flex flex-col items-center gap-1">
			<div
				className={`${sizeClass} ${state !== 'idle' ? 'animate-bounce' : ''}`}
				style={{ animationDuration: state === 'thinking' ? '1.5s' : '0.8s' }}
			>
				{sprite.emoji}
			</div>
			<span className="text-[10px] text-muted-foreground">{sprite.label}</span>
		</div>
	);
}
