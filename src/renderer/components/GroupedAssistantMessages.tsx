import React from "react";
import { Anthropic } from "@anthropic-ai/sdk";
import ChatMessage from "./ChatMessage";
import {
	Image,
	FileText,
	Code,
	Link,
	MousePointer2,
	Camera,
	Keyboard,
	MousePointerClick,
	ArrowUpDown,
} from "lucide-react";
import Markdown from "react-markdown";

export interface AssistantMessage {
	text?: string;
	action?: string;
}

export interface AssistantTextMessage {
	text: string;
	toolUses: AssistantToolMessage[];
}

export interface AssistantToolMessage {
	tool_id: string;
	tool_name: string;
	icon: string;
	action: string;
	complete: boolean;
	completeMessage?: string;
}

interface GroupedAssistantMessagesProps {
	messages: Anthropic.Beta.BetaMessageParam[];
}

const GroupedAssistantMessages: React.FC<GroupedAssistantMessagesProps> = ({
	messages,
}) => {
	const allContentBlocks = messages.reduce(
		(
			acc: Anthropic.Beta.BetaContentBlockParam[],
			message: Anthropic.Beta.BetaMessageParam
		) => {
			if (Array.isArray(message.content)) {
				return acc.concat(message.content);
			}
			return acc;
		},
		[]
	);

	const allAssistantMessages: AssistantTextMessage[] = allContentBlocks.reduce(
		(
			acc: AssistantTextMessage[],
			message: Anthropic.Beta.BetaContentBlockParam
		) => {
			if ("text" in message) {
				const newMessage: AssistantTextMessage = {
					text: message.text,
					toolUses: [],
				};
				acc.push(newMessage);
			}
			if ("type" in message) {
				if (message.type === "tool_use") {
					const actionText = (message.input as any as { action: string })
						.action;
					const toolMessage: AssistantToolMessage = {
						tool_id: message.id,
						tool_name: message.name,
						action: actionText,
						complete: false,
						icon: actionText,
					};
					acc[acc.length - 1].toolUses.push(toolMessage);
				} else if (message.type === "tool_result") {
					if (Array.isArray(message.content)) {
						const textResultMsg =
							(
								message.content.find((m) => {
									if ("text" in m) {
										return m.text;
									}
									return false;
								}) as any
							).text || "";
						const toolId = message.tool_use_id;
						const toolFindMessage = acc[acc.length - 1].toolUses.find(
							(t) => t.tool_id === toolId
						);
						if (toolFindMessage) {
							toolFindMessage.completeMessage = textResultMsg;
							toolFindMessage.complete = true;
						} else {
							console.log("Found a tool result without a tool");
						}
					}
				} else {
					//console.log("Got some other kind of message", message);
				}
			}
			return acc;
		},
		[]
	);

	const getActionIcon = (toolMsg: AssistantToolMessage) => {
		switch (toolMsg.icon) {
			case "screenshot":
				return <Camera size={16} />;
			case "mouse_move":
				return <MousePointer2 size={16} />;
			case "left_click":
			case "right_click":
			case "middle_click":
			case "double_click":
				return <MousePointerClick size={16} />;
			case "key":
			case "type":
				return <Keyboard size={16} />;
			case "left_click_drag":
				return <ArrowUpDown size={16} />;
			case "cursor_position":
				return <MousePointerClick size={16} />;
			default:
				return <FileText size={16} />;
		}
	};

	return (
		<div
			className="p-4 mb-4 py-4 rounded-md m-2 bg-anthropic-background border border-anthropic-border"
			style={{
				outlineColor: "rgb(186, 91, 56)", // We'll keep this as a style for now
			}}
		>
			{allAssistantMessages.map((group, index) => (
				<div key={index} className="mb-2">
					<Markdown>{group.text}</Markdown>
					<div className="flex gap-2 mt-1">
						{group.toolUses.map((action, actionIndex) => {
							return (
								<div key={actionIndex} className="text-anthropic-gray-500">
									{getActionIcon(action)}
								</div>
							);
						})}
					</div>
					{/*this is a divider */}
					<div className="w-100 border-t border-anthropic-border mt-2" />
				</div>
			))}
		</div>
	);
};

export default GroupedAssistantMessages;
