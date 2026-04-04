import { useEffect, useRef, useState } from 'react';
import { type DittoState, DittoSprite } from '@/components/DittoSprite';
import { type Dimension, SoulRadar, buildRadarFromAnalysis } from '@/components/SoulRadar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
	soulMd: string;
	spriteState: DittoState;
	label?: string;
	analysisData?: {
		styleMarkers?: {
			formality?: number;
			humor?: number;
			avgSentenceLength?: number;
			usesAllLowercase?: boolean;
		};
		antiPatterns?: number;
		sampleCount?: number;
	} | null;
}

interface SoulDiff {
	type: 'unchanged' | 'removed' | 'added';
	text: string;
}

function computeDiff(oldText: string, newText: string): SoulDiff[] {
	const oldLines = oldText.split('\n');
	const newLines = newText.split('\n');

	const oldSet = new Set(oldLines.map((l) => l.trim()).filter(Boolean));
	const newSet = new Set(newLines.map((l) => l.trim()).filter(Boolean));

	const removed = new Set<string>();
	for (const line of oldLines) {
		if (line.trim() && !newSet.has(line.trim())) removed.add(line.trim());
	}
	const added = new Set<string>();
	for (const line of newLines) {
		if (line.trim() && !oldSet.has(line.trim())) added.add(line.trim());
	}

	const finalDiffs: SoulDiff[] = [];
	if (removed.size > 0) {
		for (const line of oldLines) {
			if (removed.has(line.trim())) {
				finalDiffs.push({ type: 'removed', text: line });
			}
		}
	}
	for (const line of newLines) {
		finalDiffs.push({
			type: added.has(line.trim()) ? 'added' : 'unchanged',
			text: line,
		});
	}
	return finalDiffs;
}

export function SoulPanel({ soulMd, spriteState, label, analysisData }: Props) {
	const [pendingDiffs, setPendingDiffs] = useState<SoulDiff[] | null>(null);
	const [approvedSoul, setApprovedSoul] = useState(soulMd);
	const [showRadar, setShowRadar] = useState(true);
	const lastSoulRef = useRef(soulMd);

	const radarDims = buildRadarFromAnalysis(analysisData ?? null);

	useEffect(() => {
		if (soulMd === lastSoulRef.current) return;
		const old = lastSoulRef.current;
		lastSoulRef.current = soulMd;

		if (old && old !== soulMd) {
			const diffs = computeDiff(old, soulMd);
			if (diffs.some((d) => d.type !== 'unchanged')) {
				setPendingDiffs(diffs);
				return;
			}
		}
		setApprovedSoul(soulMd);
	}, [soulMd]);

	function approveDiff() {
		setApprovedSoul(soulMd);
		setPendingDiffs(null);
	}

	function rejectDiff() {
		setPendingDiffs(null);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-5.5rem)] border-l bg-muted/30 overflow-hidden">
			<div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					soul.md
				</h2>
				<div className="flex items-center gap-2">
					{pendingDiffs && (
						<span className="text-[10px] text-amber-600 font-medium animate-pulse">
							changes pending
						</span>
					)}
					{label && !pendingDiffs && (
						<span className="text-[10px] text-muted-foreground">{label}</span>
					)}
				</div>
			</div>

			{/* Sprite + Radar */}
			<div className="flex flex-col items-center py-3 border-b shrink-0 gap-1">
				<DittoSprite state={spriteState} size={48} />
				{radarDims.length >= 3 && (
					<button
						onClick={() => setShowRadar(!showRadar)}
						className="text-[9px] text-muted-foreground hover:text-foreground"
					>
						{showRadar ? 'hide' : 'show'} personality map
					</button>
				)}
			</div>

			{/* Radar chart */}
			{showRadar && radarDims.length >= 3 && (
				<div className="border-b shrink-0 flex justify-center">
					<SoulRadar dimensions={radarDims} size={180} />
				</div>
			)}

			{/* Diff approval */}
			{pendingDiffs && (
				<div className="px-4 py-2 border-b bg-amber-50 dark:bg-amber-950/20 shrink-0">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium">review changes</span>
						<div className="flex gap-1">
							<Button size="sm" variant="outline" className="h-6 text-xs px-2 text-green-700 border-green-300" onClick={approveDiff}>
								✓ approve
							</Button>
							<Button size="sm" variant="outline" className="h-6 text-xs px-2 text-red-700 border-red-300" onClick={rejectDiff}>
								✕ reject
							</Button>
						</div>
					</div>
				</div>
			)}

			<ScrollArea className="flex-1 min-h-0 p-4">
				{pendingDiffs ? (
					<div className="space-y-0">
						{pendingDiffs.map((d, i) => {
							if (d.type === 'removed') {
								return (
									<div key={`r${i}`} className="bg-red-50 dark:bg-red-950/20 px-2 py-0.5 -mx-2 rounded-sm">
										<pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-red-600 line-through">
											{d.text}
										</pre>
									</div>
								);
							}
							if (d.type === 'added') {
								return (
									<div key={`a${i}`} className="bg-green-50 dark:bg-green-950/20 px-2 py-0.5 -mx-2 rounded-sm">
										<pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-green-700 font-bold">
											{d.text}
										</pre>
									</div>
								);
							}
							return (
								<pre key={`u${i}`} className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
									{d.text}
								</pre>
							);
						})}
					</div>
				) : approvedSoul ? (
					<pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
						{approvedSoul}
					</pre>
				) : (
					<p className="text-xs text-muted-foreground">building...</p>
				)}
			</ScrollArea>
		</div>
	);
}
