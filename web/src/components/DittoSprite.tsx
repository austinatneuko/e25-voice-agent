export type DittoState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

// Use a single static sprite image from the Idle sheet (first frame).
// The sprite sheet is 48x256 with frames stacked vertically.
// Each frame is approximately 48x32 pixels.
const SPRITE_URL =
	'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0132/Idle-Anim.png';

const FRAME_W = 48;
const FRAME_H = 32;

const STATE_LABELS: Record<DittoState, string> = {
	idle: 'chilling...',
	reading: 'reading your writing...',
	writing: 'updating soul...',
	listening: 'listening...',
	thinking: 'thinking...',
	talking: 'speaking...',
};

export function DittoSprite({
	state,
	size = 64,
}: { state: DittoState; size?: number }) {
	const scale = size / FRAME_W;
	const isActive = state !== 'idle';

	return (
		<div className="flex flex-col items-center gap-2">
			{/* Glow */}
			<div className="relative" style={{ width: size, height: size * (FRAME_H / FRAME_W) }}>
				<div
					className="absolute rounded-full blur-2xl opacity-25 pointer-events-none"
					style={{
						background: 'radial-gradient(circle, var(--ditto) 0%, transparent 70%)',
						width: size * 1.5,
						height: size * 1.5,
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				/>
				{/* Single frame clipped from sprite sheet */}
				<div
					style={{
						width: size,
						height: Math.round(size * (FRAME_H / FRAME_W)),
						overflow: 'hidden',
						position: 'relative',
						animation: isActive ? 'dittoFloat 1.5s ease-in-out infinite' : 'dittoBreath 3s ease-in-out infinite',
					}}
				>
					<img
						src={SPRITE_URL}
						alt="ditto"
						style={{
							width: FRAME_W * scale,
							imageRendering: 'pixelated',
							position: 'absolute',
							top: 0,
							left: 0,
						}}
						draggable={false}
					/>
				</div>
			</div>
			<span
				className="text-[10px] font-medium tracking-wide"
				style={{ color: 'var(--ditto)' }}
			>
				{STATE_LABELS[state]}
			</span>
		</div>
	);
}
