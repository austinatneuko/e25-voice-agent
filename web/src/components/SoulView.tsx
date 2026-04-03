import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SoulView({ refreshKey }: { refreshKey: number }) {
	const [soul, setSoul] = useState<string>('');

	useEffect(() => {
		api.soulMd().then(setSoul).catch(() => setSoul(''));
	}, [refreshKey]);

	return (
		<div className="flex flex-col h-[calc(100vh-3.25rem)]">
			<div className="px-4 py-3 border-b shrink-0">
				<h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
					soul.md
				</h2>
			</div>
			<ScrollArea className="flex-1 p-4">
				{soul ? (
					<pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
						{soul}
					</pre>
				) : (
					<p className="text-xs text-muted-foreground">loading...</p>
				)}
			</ScrollArea>
		</div>
	);
}
