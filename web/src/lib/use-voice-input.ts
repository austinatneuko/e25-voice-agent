import { useCallback, useRef, useState } from 'react';

interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResultList;
}

export function useVoiceInput() {
	const [listening, setListening] = useState(false);
	const [transcript, setTranscript] = useState('');
	const recognitionRef = useRef<unknown>(null);

	const supported =
		typeof window !== 'undefined' &&
		('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

	const start = useCallback(() => {
		if (!supported) return;

		const SpeechRecognition =
			(window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
			(window as unknown as { webkitSpeechRecognition?: new () => unknown })
				.webkitSpeechRecognition;
		if (!SpeechRecognition) return;

		const recognition = new SpeechRecognition() as {
			continuous: boolean;
			interimResults: boolean;
			lang: string;
			start: () => void;
			stop: () => void;
			onresult: ((e: SpeechRecognitionEvent) => void) | null;
			onend: (() => void) | null;
			onerror: (() => void) | null;
		};
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.lang = 'en-US';

		recognition.onresult = (e: SpeechRecognitionEvent) => {
			const result = Array.from(e.results)
				.map((r) => r[0].transcript)
				.join('');
			setTranscript(result);
		};

		recognition.onend = () => setListening(false);
		recognition.onerror = () => setListening(false);

		recognitionRef.current = recognition;
		recognition.start();
		setListening(true);
		setTranscript('');
	}, [supported]);

	const stop = useCallback(() => {
		const recognition = recognitionRef.current as { stop: () => void } | null;
		recognition?.stop();
		setListening(false);
	}, []);

	return { listening, transcript, start, stop, supported };
}
