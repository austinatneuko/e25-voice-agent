import { useEffect, useRef, useState } from 'react';
import { type SpriteState, SoulSprite } from '@/components/SoulSprite';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
	soulMd: string;
	spriteState: SpriteState;
	label?: string;
}

interface SoulDiff {
	type: 'unchanged' | 'removed' | 'added';
	text: string;
}

function computeDiff(oldText: string, newText: string): SoulDiff[] {
	const oldLines = oldText.split('\n');
	const newLines = newText.split('\n');
	const diffs: SoulDiff[] = [];

	const oldSet = new Set(oldLines.map((l) => l.trim()).filter(Boolean));
	const newSet = new Set(newLines.map((l) => l.trim()).filter(Boolean));

	// Find removed lines (in old but not new)
	const removed = new Set<string>();
	for (const line of oldLines) {
		if (line.trim() && !newSet.has(line.trim())) removed.add(line.trim());
	}

	// Find added lines (in new but not old)
	const added = new Set<string>();
	for (const line of newLines) {
		if (line.trim() && !oldSet.has(line.trim())) added.add(line.trim());
	}

	// Build diff from new lines perspective
	for (const line of newLines) {
		if (added.has(line.trim())) {
			diffs.push({ type: 'added', text: line });
		} else {
			diffs.push({ type: 'unchanged', text: line });
		}
	}

	// Prepend removed lines at the positions they were
	const finalDiffs: SoulDiff[] = [];
	let oldIdx = 0;
	let newIdx = 0;

	// Simple approach: show removed lines, then the new content
	if (removed.size > 0) {
		for (const line of oldLines) {
			if (removed.has(line.trim())) {
				finalDiffs.push({ type: 'removed', text: line });
			}
		}
	}
	for (const d of diffs) {
		finalDiffs.push(d);
	}

	return finalDiffs;
}

export function SoulPanel({ soulMd, spriteState, label }: Props) {
	const [prevSoul, setPrevSoul] = useState('');
	const [pendingDiffs, setPendingDiffs] = useState<SoulDiff[] | null>(null);
	const [approvedSoul, setApprovedSoul] = useState(soulMd);
	const lastSoulRef = useRef(soulMd);

	useEffect(() => {
		if (soulMd === lastSoulRef.current) return;

		const old = lastSoulRef.current;
		lastSoulRef.current = soulMd;

		// If we have an old version, compute diff
		if (old && old !== soulMd) {
			const diffs = computeDiff(old, soulMd);
			const hasChanges = diffs.some((d) => d.type !== 'unchanged');
			if (hasChanges) {
				setPrevSoul(old);
				setPendingDiffs(diffs);
				return; // Don't auto-approve, show diff
			}
		}

		setApprovedSoul(soulMd);
	}, [soulMd]);

	function approveDiff() {
		setApprovedSoul(soulMd);
		setPendingDiffs(null);
		setPrevSoul('');
	}

	function rejectDiff() {
		// Keep the old version displayed (but backend still has new)
		setPendingDiffs(null);
		setPrevSoul('');
		// Note: we can't revert backend, but we show the old version
	}

	return (
		<div className="flex flex-col h-[calc(100vh-2.75rem)] border-l bg-muted/30">
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
			<div className="flex justify-center py-2 border-b shrink-0">
				<SoulSprite state={spriteState} size="sm" />
			</div>

			{/* Diff approval UI */}
			{pendingDiffs && (
				<div className="px-4 py-2 border-b bg-amber-50 dark:bg-amber-950/20 shrink-0">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-medium">soul updated — review changes</span>
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

			<ScrollArea className="flex-1 p-4">
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
