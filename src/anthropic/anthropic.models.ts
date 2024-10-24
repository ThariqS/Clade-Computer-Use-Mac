export enum Sender {
	USER = "user",
	BOT = "assistant",
	TOOL = "tool",
}

export interface TextBlock {
	type: "text";
	text: string;
}

export interface ToolUseBlock {
	type: "tool_use";
	name: string;
	input: string;
}

export type MessageContent = TextBlock | ToolUseBlock;

export interface Message {
	role: Sender;
	content: MessageContent[];
}

export interface ToolResult {
	output?: string;
	error?: string;
	base64_image?: string;
}

export interface APIResponse {
	// Define the structure of your API response here
	// This is a simplified version
	status: number;
	headers: Record<string, string>;
	data: any;
}
