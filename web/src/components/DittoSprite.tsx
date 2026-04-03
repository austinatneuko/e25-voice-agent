export type DittoState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

// Sprite sheet is 48x256, but contains 2 columns (24px each) x N rows
// Each individual Ditto frame is 24x24 pixels
// We clip to just the left column, first row
const SPRITE_URL =
	'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0132/Idle-Anim.png';

const FRAME_SIZE = 24; // single ditto is 24x24

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
	const scale = size / FRAME_SIZE;
	const isActive = state !== 'idle';

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
				{/* Clip to single 24x24 frame, then scale up */}
				<div
					style={{
						width: size,
						height: size,
						overflow: 'hidden',
						position: 'relative',
						animation: isActive
							? 'dittoFloat 1.5s ease-in-out infinite'
							: 'dittoBreath 3s ease-in-out infinite',
					}}
				>
					<img
						src={SPRITE_URL}
						alt="ditto"
						style={{
							// Scale the 24px frame to fill the container
							width: 48 * scale, // full sheet width scaled
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
