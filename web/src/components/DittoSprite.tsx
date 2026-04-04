export type DittoState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

// Sprite sheet: 48px wide x 256px tall
// Layout: 2 columns (24px each), multiple rows (24px each)
// We want ONE ditto: top-left 24x24 region
const SPRITE_URL =
	'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0132/Idle-Anim.png';

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
	const isActive = state !== 'idle';

	// Use background-image to show only the top-left 24x24 of the 48x256 sheet
	// background-size scales the full sheet so that 24px of it = size
	// That means full sheet width (48px) maps to size*2, height (256) maps proportionally
	const bgWidth = size * 2; // 48px sheet → show 24px = half = size
	const bgHeight = (256 / 48) * bgWidth; // maintain aspect ratio

	return (
		<div className="flex flex-col items-center gap-2">
			<div className="relative" style={{ width: size, height: size }}>
				{/* Soft glow */}
				<div
					className="absolute rounded-full blur-2xl opacity-20 pointer-events-none"
					style={{
						background: 'radial-gradient(circle, var(--ditto) 0%, transparent 70%)',
						width: size * 2,
						height: size * 2,
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
					}}
				/>
				{/* Single 24x24 frame via background clipping */}
				<div
					style={{
						width: size,
						height: size,
						backgroundImage: `url(${SPRITE_URL})`,
						backgroundSize: `${bgWidth}px ${bgHeight}px`,
						backgroundPosition: '0 0',
						backgroundRepeat: 'no-repeat',
						imageRendering: 'pixelated',
						animation: isActive
							? 'dittoFloat 1.5s ease-in-out infinite'
							: 'dittoBreath 3s ease-in-out infinite',
					}}
				/>
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
