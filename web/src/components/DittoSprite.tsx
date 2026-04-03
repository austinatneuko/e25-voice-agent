import { useEffect, useState } from 'react';

export type DittoState = 'idle' | 'reading' | 'writing' | 'listening' | 'thinking' | 'talking';

const SPRITE_BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0132';

// Map our states to PMD animation names + frame config
// Ditto frames are ~48x48, arranged horizontally in sprite sheets
const STATE_MAP: Record<DittoState, { anim: string; frames: number; speed: number }> = {
	idle: { anim: 'Idle', frames: 4, speed: 400 },
	reading: { anim: 'Walk', frames: 4, speed: 250 },
	writing: { anim: 'Attack', frames: 6, speed: 150 },
	listening: { anim: 'Hop', frames: 4, speed: 300 },
	thinking: { anim: 'Rotate', frames: 4, speed: 350 },
	talking: { anim: 'Swing', frames: 5, speed: 200 },
};

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
	const [frame, setFrame] = useState(0);
	const config = STATE_MAP[state];
	const spriteUrl = `${SPRITE_BASE}/${config.anim}-Anim.png`;

	useEffect(() => {
		setFrame(0);
		const interval = setInterval(() => {
			setFrame((f) => (f + 1) % config.frames);
		}, config.speed);
		return () => clearInterval(interval);
	}, [state, config.frames, config.speed]);

	return (
		<div className="flex flex-col items-center gap-1.5">
			<div
				className="relative"
				style={{ width: size, height: size }}
			>
				{/* Pink glow behind Ditto */}
				<div
					className="absolute inset-0 rounded-full blur-xl opacity-40"
					style={{
						background: 'radial-gradient(circle, #FF6B9D 0%, #C084FC 60%, transparent 80%)',
						transform: 'scale(1.5)',
					}}
				/>
				{/* Sprite */}
				<div
					style={{
						width: size,
						height: size,
						backgroundImage: `url(${spriteUrl})`,
						backgroundPosition: `-${frame * 48}px 0px`,
						backgroundSize: 'auto',
						backgroundRepeat: 'no-repeat',
						imageRendering: 'pixelated',
						transform: `scale(${size / 48})`,
						transformOrigin: 'top left',
						position: 'absolute',
						top: 0,
						left: 0,
					}}
				/>
			</div>
			<span className="text-[10px] font-medium text-pink-400/80 tracking-wide">
				{STATE_LABELS[state]}
			</span>
		</div>
	);
}
