import { useState } from 'react';
import { ChatView } from '@/components/ChatView';
import { SoulView } from '@/components/SoulView';
import { TrainView } from '@/components/TrainView';

type AppPhase = 'train' | 'live';

function App() {
	const [phase, setPhase] = useState<AppPhase>('train');
	const [soulVersion, setSoulVersion] = useState(0);

	if (phase === 'live') {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<header className="border-b px-6 py-3 flex items-center justify-between shrink-0">
					<h1 className="text-sm font-medium tracking-tight">voice agent trainer</h1>
					<button
						onClick={() => setPhase('train')}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						back to training
					</button>
				</header>
				<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-0">
					<div className="min-h-0 border-r">
						<ChatView onCorrection={() => setSoulVersion((v) => v + 1)} />
					</div>
					<div className="min-h-0 hidden lg:block">
						<SoulView refreshKey={soulVersion} />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b px-6 py-3">
				<h1 className="text-sm font-medium tracking-tight">voice agent trainer</h1>
			</header>
			<TrainView onComplete={() => setPhase('live')} />
		</div>
	);
}

export default App;
