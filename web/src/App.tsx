import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatView } from '@/components/ChatView';
import { SoulView } from '@/components/SoulView';
import { TrainView } from '@/components/TrainView';

function App() {
	const [tab, setTab] = useState('train');

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b px-6 py-3 flex items-center justify-between">
				<h1 className="text-sm font-medium tracking-tight">voice agent trainer</h1>
			</header>
			<Tabs value={tab} onValueChange={setTab} className="w-full">
				<div className="border-b px-6">
					<TabsList className="bg-transparent h-10">
						<TabsTrigger value="train" className="text-xs">
							train
						</TabsTrigger>
						<TabsTrigger value="chat" className="text-xs">
							chat
						</TabsTrigger>
						<TabsTrigger value="soul" className="text-xs">
							soul.md
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="train" className="mt-0">
					<TrainView onComplete={() => setTab('chat')} />
				</TabsContent>
				<TabsContent value="chat" className="mt-0">
					<ChatView />
				</TabsContent>
				<TabsContent value="soul" className="mt-0">
					<SoulView />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default App;
