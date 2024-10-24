import React from "react";
import { Anthropic } from "@anthropic-ai/sdk";
import ChatMessage from "./ChatMessage";
import GroupedAssistantMessages from "./GroupedAssistantMessages";
interface MessagesRendererProps {
	messages: Anthropic.Beta.BetaMessageParam[];
	hideImages: boolean;
}

const MessagesRenderer: React.FC<MessagesRendererProps> = ({
	messages,
	hideImages,
}) => {
	const groupedMessages = messages.reduce(
		(acc, message, index) => {
			if (
				message.role === "user" &&
				(!Array.isArray(message.content) ||
					!message.content.some((content) => content.type === "tool_result"))
			) {
				acc.push({ user: message, assistant: [] });
			} else {
				if (acc.length === 0 || acc[acc.length - 1].user) {
					acc.push({ user: null, assistant: [message] });
				} else {
					acc[acc.length - 1].assistant.push(message);
				}
			}
			return acc;
		},
		[] as {
			user: Anthropic.Beta.BetaMessageParam | null;
			assistant: Anthropic.Beta.BetaMessageParam[];
		}[]
	);

	console.log(groupedMessages);

	return (
		<>
			{groupedMessages.map((group, index) => (
				<React.Fragment key={index}>
					{group.user && (
						<ChatMessage message={group.user} hideImages={hideImages} />
					)}
					{group.assistant.length > 0 && (
						<GroupedAssistantMessages messages={group.assistant} />
					)}
				</React.Fragment>
			))}
		</>
	);
};

export default MessagesRenderer;
