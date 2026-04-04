/**
 * SVG Radar chart showing soul personality dimensions.
 * Data derived from real voice analysis — never hallucinated.
 */

export interface Dimension {
	label: string;
	value: number; // 0-1
}

interface Props {
	dimensions: Dimension[];
	size?: number;
}

export function SoulRadar({ dimensions, size = 240 }: Props) {
	if (dimensions.length < 3) return null;

	const padding = 80; // generous space for labels
	const viewSize = size + padding * 2;
	const cx = viewSize / 2;
	const cy = viewSize / 2;
	const radius = size * 0.38;
	const n = dimensions.length;
	const angleStep = (Math.PI * 2) / n;

	const rings = [0.25, 0.5, 0.75, 1.0];

	function polarToCart(angle: number, r: number): [number, number] {
		return [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];
	}

	const dataPoints = dimensions.map((d, i) => {
		const angle = i * angleStep;
		return polarToCart(angle, d.value * radius);
	});
	const dataPath =
		dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

	return (
		<svg
			width="100%"
			viewBox={`0 0 ${viewSize} ${viewSize}`}
			style={{ maxWidth: viewSize }}
		>
			{/* Background rings */}
			{rings.map((ring) => {
				const points = Array.from({ length: n }, (_, i) =>
					polarToCart(i * angleStep, ring * radius),
				);
				const path =
					points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
				return (
					<path
						key={ring}
						d={path}
						fill="none"
						stroke="var(--border)"
						strokeWidth={ring === 1 ? 1.5 : 0.5}
						opacity={0.5}
					/>
				);
			})}

			{/* Axis lines */}
			{dimensions.map((_, i) => {
				const [x, y] = polarToCart(i * angleStep, radius);
				return (
					<line
						key={`ax${i}`}
						x1={cx}
						y1={cy}
						x2={x}
						y2={y}
						stroke="var(--border)"
						strokeWidth={0.5}
						opacity={0.3}
					/>
				);
			})}

			{/* Data fill */}
			<path
				d={dataPath}
				fill="var(--ditto)"
				fillOpacity={0.15}
				stroke="var(--ditto)"
				strokeWidth={2}
				strokeLinejoin="round"
			/>

			{/* Data dots */}
			{dataPoints.map((p, i) => (
				<circle key={`d${i}`} cx={p[0]} cy={p[1]} r={3} fill="var(--ditto)" />
			))}

			{/* Labels — positioned outside the chart with enough room */}
			{dimensions.map((d, i) => {
				const angle = i * angleStep;
				const [x, y] = polarToCart(angle, radius + 28);

				// Adjust text anchor based on position
				let anchor: 'start' | 'middle' | 'end' = 'middle';
				const normalizedX = x - cx;
				if (normalizedX > 5) anchor = 'start';
				else if (normalizedX < -5) anchor = 'end';

				return (
					<text
						key={`l${i}`}
						x={x}
						y={y}
						textAnchor={anchor}
						dominantBaseline="middle"
						fontSize={10}
						fontFamily="var(--font-sans)"
						fontWeight={500}
						fill="var(--muted-foreground)"
					>
						{d.label}
						<tspan dx={4} fontSize={8} fill="var(--ditto)" opacity={0.7}>
							{Math.round(d.value * 100)}
						</tspan>
					</text>
				);
			})}
		</svg>
	);
}

/**
 * Build radar dimensions from analysis data.
 * Only uses real measured values — nothing made up.
 */
export function buildRadarFromAnalysis(analysis: {
	styleMarkers?: {
		formality?: number;
		humor?: number;
		avgSentenceLength?: number;
		usesAllLowercase?: boolean;
	};
	antiPatterns?: number;
	sampleCount?: number;
} | null): Dimension[] {
	if (!analysis?.styleMarkers) return [];

	const sm = analysis.styleMarkers;
	const dims: Dimension[] = [];

	if (sm.formality != null) {
		dims.push({ label: 'formality', value: sm.formality });
		dims.push({ label: 'casualness', value: 1 - sm.formality });
	}

	if (sm.humor != null) {
		dims.push({ label: 'humor', value: sm.humor });
	}

	// Brevity: shorter avg sentence = more brief
	// Scale: 5 words = very brief (1.0), 25+ words = not brief (0.0)
	if (sm.avgSentenceLength != null) {
		const brevity = Math.max(0, Math.min(1, (25 - sm.avgSentenceLength) / 20));
		dims.push({ label: 'brevity', value: brevity });
	}

	if (sm.usesAllLowercase != null) {
		dims.push({
			label: sm.usesAllLowercase ? 'unconventional' : 'conventional',
			value: sm.usesAllLowercase ? 0.85 : 0.7,
		});
	}

	if (analysis.antiPatterns != null && analysis.antiPatterns > 0) {
		dims.push({
			label: 'distinctiveness',
			value: Math.min(1, analysis.antiPatterns / 8),
		});
	}

	if (analysis.sampleCount != null) {
		dims.push({
			label: 'data depth',
			value: Math.min(1, analysis.sampleCount / 30),
		});
	}

	return dims;
}
