import { Circle, Mic, Square } from "lucide-react";
import React, { useState, useRef } from "react";

interface AudioRecorderProps {
	onTranscription: (text: string) => void;
	onTranscriptionStart: () => void;
	onTranscriptionEnd: () => void;
}

const OPENAI_API_KEY = "";

const AudioRecorder: React.FC<AudioRecorderProps> = ({
	onTranscription,
	onTranscriptionStart,
	onTranscriptionEnd,
}) => {
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);

	const startRecording = async () => {
		try {
			onTranscriptionStart();
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorderRef.current = new MediaRecorder(stream);

			mediaRecorderRef.current.ondataavailable = (event) => {
				audioChunksRef.current.push(event.data);
			};

			mediaRecorderRef.current.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/wav",
				});
				setIsTranscribing(true);
				try {
					const transcription = await transcribeAudio(audioBlob);
					onTranscription(transcription);
				} catch (error) {
					console.error("Transcription error:", error);
					onTranscription("Error during transcription. Please try again.");
				}
				setIsTranscribing(false);
				onTranscriptionEnd();
				audioChunksRef.current = [];
			};

			mediaRecorderRef.current.start();
			setIsRecording(true);
		} catch (error) {
			console.error("Error starting recording:", error);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			onTranscriptionEnd();
		}
	};

	const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
		const formData = new FormData();
		formData.append("file", audioBlob, "audio.wav");
		formData.append("model", "whisper-1");

		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${OPENAI_API_KEY}`,
				},
				body: formData,
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.text;
	};

	if (isRecording) {
		return (
			<button
				onClick={stopRecording}
				className="bg-red-400 text-white px-2 py-2 rounded"
				disabled={isTranscribing}
			>
				<Square fill="white" size={16} />
			</button>
		);
	} else {
		return (
			<button
				onClick={startRecording}
				className="px-2 py-2 rounded bg-anthropic-background border border-anthropic-border text-anthropic-gray-500 hover:bg-anthropic-border"
				disabled={isTranscribing}
			>
				<Mic size={16} />
			</button>
		);
	}
};

export default AudioRecorder;
