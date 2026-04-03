/**
 * SVG Radar chart showing soul personality dimensions.
 * Data comes from voice analysis (styleMarkers.tone) and interview answers.
 */

interface Dimension {
	label: string;
	value: number; // 0-1
}

interface Props {
	dimensions: Dimension[];
	size?: number;
}

export function SoulRadar({ dimensions, size = 280 }: Props) {
	if (dimensions.length < 3) return null;

	const cx = size / 2;
	const cy = size / 2;
	const radius = size * 0.36;
	const n = dimensions.length;
	const angleStep = (Math.PI * 2) / n;

	// Generate ring levels (0.25, 0.5, 0.75, 1.0)
	const rings = [0.25, 0.5, 0.75, 1.0];

	function polarToCart(angle: number, r: number): [number, number] {
		return [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];
	}

	// Data polygon points
	const dataPoints = dimensions.map((d, i) => {
		const angle = i * angleStep;
		const r = d.value * radius;
		return polarToCart(angle, r);
	});
	const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

	return (
		<div className="flex flex-col items-center">
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				{/* Background rings */}
				{rings.map((ring) => {
					const points = Array.from({ length: n }, (_, i) => {
						const angle = i * angleStep;
						return polarToCart(angle, ring * radius);
					});
					const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
					return (
						<path
							key={ring}
							d={path}
							fill="none"
							stroke="var(--border)"
							strokeWidth={ring === 1 ? 1.5 : 0.5}
							opacity={0.6}
						/>
					);
				})}

				{/* Axis lines */}
				{dimensions.map((_, i) => {
					const angle = i * angleStep;
					const [x, y] = polarToCart(angle, radius);
					return (
						<line
							key={`axis-${i}`}
							x1={cx}
							y1={cy}
							x2={x}
							y2={y}
							stroke="var(--border)"
							strokeWidth={0.5}
							opacity={0.4}
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

				{/* Data points */}
				{dataPoints.map((p, i) => (
					<circle
						key={`dot-${i}`}
						cx={p[0]}
						cy={p[1]}
						r={3}
						fill="var(--ditto)"
					/>
				))}

				{/* Labels */}
				{dimensions.map((d, i) => {
					const angle = i * angleStep;
					const labelR = radius + 24;
					const [x, y] = polarToCart(angle, labelR);
					return (
						<text
							key={`label-${i}`}
							x={x}
							y={y}
							textAnchor="middle"
							dominantBaseline="middle"
							fontSize={9}
							fontFamily="var(--font-sans)"
							fontWeight={500}
							fill="var(--muted-foreground)"
						>
							{d.label}
						</text>
					);
				})}
			</svg>
		</div>
	);
}

/**
 * Build radar dimensions from soul.md analysis data.
 * Uses real data from voice analysis + interview — never hallucinated.
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
	if (!analysis) return [];

	const dims: Dimension[] = [];
	const sm = analysis.styleMarkers;
	if (!sm) return [];

	// Only add dimensions we actually have data for
	if (sm.formality != null) {
		dims.push({ label: 'formality', value: sm.formality });
		dims.push({ label: 'casualness', value: 1 - sm.formality });
	}
	if (sm.humor != null) {
		dims.push({ label: 'humor', value: sm.humor });
	}

	// Derive brevity from avg sentence length (shorter = more brief)
	if (sm.avgSentenceLength != null) {
		const brevity = Math.max(0, Math.min(1, 1 - sm.avgSentenceLength / 30));
		dims.push({ label: 'brevity', value: brevity });
		dims.push({ label: 'verbosity', value: 1 - brevity });
	}

	// Lowercase = unconventional
	if (sm.usesAllLowercase != null) {
		dims.push({ label: 'convention', value: sm.usesAllLowercase ? 0.2 : 0.8 });
	}

	// Anti-patterns found = more opinionated/distinctive
	if (analysis.antiPatterns != null) {
		const distinctiveness = Math.min(1, analysis.antiPatterns / 10);
		dims.push({ label: 'distinctiveness', value: distinctiveness });
	}

	// Sample volume = confidence in analysis
	if (analysis.sampleCount != null) {
		const dataRichness = Math.min(1, analysis.sampleCount / 50);
		dims.push({ label: 'data richness', value: dataRichness });
	}

	return dims;
}
