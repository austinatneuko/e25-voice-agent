import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SoulView() {
	const [soul, setSoul] = useState<string | null>(null);

	useEffect(() => {
		api.soulMd().then(setSoul).catch(() => setSoul(null));
	}, []);

	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle>SOUL.md</CardTitle>
				</CardHeader>
				<CardContent>
					{soul ? (
						<ScrollArea className="h-[calc(100vh-16rem)]">
							<pre className="text-sm whitespace-pre-wrap font-mono">{soul}</pre>
						</ScrollArea>
					) : (
						<p className="text-sm text-muted-foreground">
							no voice profile built yet. complete the training flow first.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
