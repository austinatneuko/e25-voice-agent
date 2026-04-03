import { useState } from 'react';
import type { AnalysisResult } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
	analysis: AnalysisResult | null;
	antiPatterns: Array<{ pattern: string; reason: string; example?: string }>;
	onStartInterview: () => void;
	onSkipToChat: () => void;
}

export function AnalysisStep({ analysis, antiPatterns, onStartInterview, onSkipToChat }: Props) {
	const [showAntiPatterns, setShowAntiPatterns] = useState(false);

	if (!analysis) return null;

	return (
		<div className="p-6 space-y-4 overflow-auto">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">voice analysis complete</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm">{analysis.summary}</p>
					<div className="flex gap-2 flex-wrap">
						<Badge variant="outline">avg {analysis.styleMarkers.avgSentenceLength} words/sentence</Badge>
						<Badge variant="outline">formality: {Math.round(analysis.styleMarkers.formality * 100)}%</Badge>
						<Badge variant="outline">humor: {Math.round(analysis.styleMarkers.humor * 100)}%</Badge>
						{analysis.styleMarkers.usesAllLowercase && <Badge variant="outline">all lowercase</Badge>}
					</div>
					{analysis.styleMarkers.signaturePhrases.length > 0 && (
						<div className="text-xs text-muted-foreground">
							signature phrases: {analysis.styleMarkers.signaturePhrases.join(', ')}
						</div>
					)}
				</CardContent>
			</Card>

			{antiPatterns.length > 0 && (
				<Card>
					<CardHeader>
						<button
							onClick={() => setShowAntiPatterns(!showAntiPatterns)}
							className="flex items-center justify-between w-full text-left"
						>
							<CardTitle className="text-base">
								{antiPatterns.length} anti-patterns found
							</CardTitle>
							<span className="text-xs text-muted-foreground">
								{showAntiPatterns ? 'hide' : 'show'}
							</span>
						</button>
					</CardHeader>
					{showAntiPatterns && (
						<CardContent>
							<ScrollArea className="max-h-64">
								<div className="space-y-3">
									{antiPatterns.map((ap, i) => (
										<div key={i} className="border-b pb-2 last:border-0">
											<p className="text-sm font-medium">{ap.pattern}</p>
											<p className="text-xs text-muted-foreground">{ap.reason}</p>
											{ap.example && (
												<p className="text-xs text-destructive/70 mt-1 italic">
													bad: "{ap.example}"
												</p>
											)}
										</div>
									))}
								</div>
							</ScrollArea>
						</CardContent>
					)}
				</Card>
			)}

			<div className="flex gap-3">
				<Button onClick={onStartInterview} className="flex-1">
					refine with interview
				</Button>
				<Button onClick={onSkipToChat} variant="outline" className="flex-1">
					skip to chat
				</Button>
			</div>
			<p className="text-xs text-center text-muted-foreground">
				the interview is optional — you can train by chatting directly
			</p>
		</div>
	);
}
