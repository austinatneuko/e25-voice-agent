import { type SpriteState, SoulSprite } from '@/components/SoulSprite';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
	soulMd: string;
	spriteState: SpriteState;
	label?: string;
}

export function SoulPanel({ soulMd, spriteState, label }: Props) {
	return (
		<div className="flex flex-col h-[calc(100vh-2.75rem)] border-l bg-muted/30">
			<div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					soul.md
				</h2>
				{label && (
					<span className="text-[10px] text-muted-foreground">{label}</span>
				)}
			</div>
			<div className="flex justify-center py-3 border-b shrink-0">
				<SoulSprite state={spriteState} size="sm" />
			</div>
			<ScrollArea className="flex-1 p-4">
				{soulMd ? (
					<pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
						{soulMd}
					</pre>
				) : (
					<p className="text-xs text-muted-foreground">building...</p>
				)}
			</ScrollArea>
		</div>
	);
}
