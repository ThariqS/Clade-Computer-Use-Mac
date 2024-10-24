import React from "react";
import {
	Message,
	Sender,
	TextBlock,
	ToolUseBlock,
	ToolResult,
} from "../../anthropic/anthropic.models";
import {
	BetaMessage,
	BetaMessageParam,
	BetaContentBlockParam,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
	message: BetaMessageParam;
	hideImages: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, hideImages }) => {
	const renderContent = (content: BetaContentBlockParam) => {
		if ("text" in content) {
			return (
				<div>
					<ReactMarkdown>{content.text}</ReactMarkdown>
				</div>
			);
		}
		if ("type" in content && content.type === "tool_result") {
			if ("content" in content && Array.isArray(content.content)) {
				const firstContent = content.content[0];
				if (typeof firstContent === "object" && "text" in firstContent) {
					return (
						<div>
							<ReactMarkdown>{firstContent.text}</ReactMarkdown>
						</div>
					);
				}
			}
		}
		if ("type" in content && content.type === "tool_use") {
			if ("input" in content && typeof content.input === "object") {
				if ("action" in content.input) {
					return <p>Doing ... {content.input.action as string}</p>;
				}
			}
		}
		if ("type" in content && content.type === "image") {
			return null;
		}
		//{"type":"tool_result","content":[{"type":"text","text":"Screenshot taken successfully"},
		//{"type":"tool_use","id":"toolu_013zBVVTf3fb8vowkrYeCeKr","name":"computer","input":{"action":"screenshot"}}

		//type: "image"
		return <p>{JSON.stringify(content)}</p>;
		/*
		if ("text" in content) {
			return <p>{content.text}</p>;
		} else if ("name" in content) {
			return (
				<pre>
					Tool Use: {content.name}
					Input: {content.input}
				</pre>
			);
		} else if ("output" in content || "error" in content) {
			return (
				<>
					{content.output && <pre>{content}</pre>}
					{content.error && <div className="text-red-500">{content.error}</div>}
					{!hideImages && content.base64_image && (
						<img
							src={`data:image/png;base64,${content.base64_image}`}
							alt="Tool output"
						/>
					)}
				</>
			);
		}
			*/
	};

	return (
		<div className="pl-4 mb-4 py-4 rounded-md m-2 bg-anthropic-message-background">
			{Array.isArray(message.content) &&
				message.content.map((item, index) => (
					<div key={index}>{renderContent(item)}</div>
				))}
		</div>
	);
};

export default ChatMessage;
