import React, { useEffect, useRef, useState } from "react";
import { ToolResult } from "../anthropic/anthropic.models";
// Add these imports
import Anthropic from "@anthropic-ai/sdk";
import { Plus, Send } from "lucide-react";
import {
	APIProvider,
	PROVIDER_TO_DEFAULT_MODEL_NAME,
	samplingLoop,
} from "../anthropic/loop";
import MessagesRenderer from "./components/MessagesRenderer";
import {
	AutosizeTextarea,
	AutosizeTextAreaRef,
} from "./components/ui/autosizetextarea";
import { bridge } from "./window.model";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";

const Home: React.FC = () => {
	const [messages, setMessages] = useState<Anthropic.Beta.BetaMessageParam[]>(
		[]
	);
	const [tempApiKey, setTempApiKey] = useState<string>("");
	const [apiKey, setApiKey] = useState<string>("");
	const [provider, setProvider] = useState<APIProvider>(APIProvider.ANTHROPIC);
	const [model, setModel] = useState<string>(
		PROVIDER_TO_DEFAULT_MODEL_NAME[APIProvider.ANTHROPIC]
	);
	const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");
	const [hideImages, setHideImages] = useState<boolean>(false);
	const [apiResponses, setApiResponses] = useState<
		Record<string, Anthropic.Beta.BetaMessage>
	>({});
	const [tools, setTools] = useState<Record<string, ToolResult>>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [inputMessage, setInputMessage] = useState<string>("");
	const [isAIOperating, setIsAIOperating] = useState<boolean>(false);
	const [isAIPaused, setIsAIPaused] = useState<boolean>(false);
	const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
	const inputRef = useRef<AutosizeTextAreaRef>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
	};

	useEffect(() => {
		// Load messages from localStorage
		const storedMessages = localStorage.getItem("chatMessages");
		if (storedMessages) {
			setMessages(JSON.parse(storedMessages));
		}
		// Load initial state from localStorage or environment variables
		const storedApiKey = localStorage.getItem("apiKey") || "";
		setApiKey(storedApiKey);
		// ... load other initial states
	}, []);

	// Add this useEffect to save messages to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem("chatMessages", JSON.stringify(messages));
	}, [messages]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		bridge.onAIOperationPaused(() => {
			setIsAIPaused(true);
			console.log("AI operation paused");
			// You can add any other logic here, like showing a notification
		});

		bridge.onAIOperationResumed(() => {
			setIsAIPaused(false);
			console.log("AI operation resumed");
			// You can add any other logic here, like hiding a notification
		});
	}, []);

	const handleNewMessage = async (content: string) => {
		const newMessage: Anthropic.Beta.BetaMessageParam = {
			role: "user",
			content: [{ type: "text", text: content }],
		};
		setInputMessage("");
		setMessages((prevMessages) => [...prevMessages, newMessage]);
		setIsLoading(true);

		try {
			await bridge.setAIOperating(true);
			setIsAIOperating(true);

			const updatedMessages = await samplingLoop({
				model,
				provider,
				systemPromptSuffix: customSystemPrompt,
				messages: [...messages, newMessage],
				outputCallback: handleOutputCallback,
				toolOutputCallback: handleToolOutputCallback,
				apiResponseCallback: handleApiResponseCallback,
				apiKey,
				onlyNMostRecentImages: 10, // You can make this configurable
				maxTokens: 4096, // You can make this configurable
			});

			setMessages(updatedMessages);
		} catch (error) {
			console.error("Error in sampling loop:", error);
			// Handle error (e.g., show an error message to the user)
		} finally {
			setIsLoading(false);
			await bridge.setAIOperating(false);
			inputRef.current?.focus();
			scrollToBottom();
			setIsAIOperating(false);
		}
	};

	const handleOutputCallback = (block: Anthropic.Beta.BetaContentBlock) => {
		setMessages((prevMessages) => [
			...prevMessages,
			{ role: "assistant", content: [block] },
		]);
	};

	const handleToolOutputCallback = (result: ToolResult, id: string) => {
		setTools((prevTools) => ({ ...prevTools, [id]: result }));
	};

	const handleApiResponseCallback = (response: Anthropic.Beta.BetaMessage) => {
		const responseId = Date.now().toString();
		setApiResponses((prevResponses) => ({
			...prevResponses,
			[responseId]: response,
		}));
	};

	const handleReset = () => {
		setMessages([]);
		localStorage.removeItem("chatMessages"); // Clear messages from localStorage
		setApiResponses({});
		setTools({});
		inputRef.current?.focus();
		// Reset other state variables as needed
	};

	const handleTranscription = (text: string) => {
		setInputMessage(text);
	};

	const handleTranscriptionStart = () => {
		setIsTranscribing(true);
	};

	const handleTranscriptionEnd = () => {
		setIsTranscribing(false);
		inputRef.current?.focus();
	};

	console.log(messages);

	if (!apiKey) {
		return (
			<div className="flex flex-col gap-2 mx-4 h-screen items-center justify-center">
				<div className="text-center">Please enter your Anthropic API key</div>
				<div className="flex items-center space-x-2 w-full">
					<Input
						className="w-5/6"
						type="text"
						value={tempApiKey}
						onChange={(e) => setTempApiKey(e.target.value)}
					/>
					<Button onClick={() => setApiKey(tempApiKey)}>Submit</Button>
				</div>
				<div className="text-center text-xs">This is stored locally.</div>
			</div>
		);
	}

	let header;
	if (!isAIOperating && !isAIPaused) {
		header = (
			<div className="px-4 flex items-center justify-between bg-anthropic-message-background fixed w-full h-10 border-b border-anthropic-border mb-2.5">
				<span className="text-sm text-anthropic-gray-500">
					AI Computer Helper
				</span>
				<button className="px-1 py-1 rounded bg-anthropic-background border border-anthropic-border text-anthropic-gray-500 hover:bg-anthropic-border">
					<Plus
						size={16}
						onClick={() => {
							handleReset();
						}}
					/>
				</button>
			</div>
		);
	} else if (isAIOperating && !isAIPaused) {
		header = (
			<div className="px-4 flex items-center justify-between bg-anthropic-amber text-white fixed w-full h-10 border-b border-anthropic-border mb-2.5">
				<span className="text-sm">AI is Operating</span>
				<span className="text-sm">press Spacebar to pause</span>
			</div>
		);
	} else if (isAIPaused) {
		header = (
			<div className="px-4 flex items-center justify-between bg-yellow-500 fixed w-full h-10 border-b border-anthropic-border mb-2.5">
				<div className="text-white p-2 text-center">Paused</div>
				<button
					className="text-sm border border-white rounded px-2 py-1 text-white hover:bg-white hover:text-black cursor-pointer"
					onClick={() => {
						//bridge.resumeAIOperation();
					}}
				>
					Resume
				</button>
				<button className="px-1 py-1 rounded bg-anthropic-background border border-anthropic-border text-anthropic-gray-500 hover:bg-anthropic-border">
					<Plus
						size={16}
						onClick={() => {
							handleReset();
						}}
					/>
				</button>
			</div>
		);
	}

	return (
		<div className="flex h-screen">
			{header}
			<div className="flex-1 flex flex-col mt-10">
				<div className="flex-1 overflow-y-auto p-1 space-y-1">
					<MessagesRenderer messages={messages} hideImages={hideImages} />
					<div ref={messagesEndRef} />
					{!isLoading && <div className="h-[5px]"></div>}
					{!isLoading && <div className="h-[40px]"></div>}
					{!isLoading ? (
						<div className="absolute bottom-0 left-0 right-0 p-4 bg-white mx-1 rounded-md border border-anthropic-border">
							<div className="flex items-center space-x-2">
								<AutosizeTextarea
									ref={inputRef}
									minHeight={28}
									value={inputMessage}
									onChange={(e) => setInputMessage(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleNewMessage(inputMessage);
										}
									}}
									className="flex-1 border rounded"
									placeholder="Type your message..."
									autoFocus
									disabled={isTranscribing}
								/>
								<button
									onClick={() => handleNewMessage(inputMessage)}
									className="bg-anthropic-amber text-white px-2 py-2 rounded"
									disabled={isTranscribing}
								>
									<Send size={16} />
								</button>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default Home;
