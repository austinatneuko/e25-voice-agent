export type DittoState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0132';

// Each anim sheet is 48px wide, frames stacked vertically at ~48x48 per frame
const STATE_MAP: Record<DittoState, { anim: string; label: string }> = {
	idle: { anim: 'Idle', label: 'chilling...' },
	reading: { anim: 'Walk', label: 'reading your writing...' },
	writing: { anim: 'Attack', label: 'updating soul...' },
	listening: { anim: 'Hop', label: 'listening...' },
	thinking: { anim: 'Rotate', label: 'thinking...' },
	talking: { anim: 'Swing', label: 'speaking...' },
};

export function DittoSprite({
	state,
	size = 64,
}: { state: DittoState; size?: number }) {
	const config = STATE_MAP[state];
	const spriteUrl = `${SPRITE_BASE}/${config.anim}-Anim.png`;
	const scale = size / 48;

	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className="relative"
				style={{ width: size, height: size }}
			>
				{/* Soft pink glow */}
				<div
					className="absolute rounded-full blur-2xl opacity-30"
					style={{
						background: 'radial-gradient(circle, var(--ditto) 0%, var(--ditto-glow) 50%, transparent 70%)',
						width: size * 1.8,
						height: size * 1.8,
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				/>
				{/* Sprite — show first frame only, gentle bob animation */}
				<div
					className={state !== 'idle' ? 'animate-bounce' : ''}
					style={{
						width: 48,
						height: 48,
						backgroundImage: `url(${spriteUrl})`,
						backgroundPosition: '0px 0px',
						backgroundSize: '48px auto',
						backgroundRepeat: 'no-repeat',
						imageRendering: 'pixelated',
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
						position: 'absolute',
						top: 0,
						left: 0,
						animationDuration: state === 'thinking' ? '2s' : '1.2s',
						animationTimingFunction: 'ease-in-out',
					}}
				/>
			</div>
			<span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--ditto)' }}>
				{config.label}
			</span>
		</div>
	);
}
