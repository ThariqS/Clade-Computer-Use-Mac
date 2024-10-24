import Anthropic from "@anthropic-ai/sdk";

export interface ToolResult {
	output?: string;
	error?: string;
	base64Image?: string;
}

export class ToolFailure implements ToolResult {
	constructor(public error: string) {}
}

export class ToolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ToolError";
	}
}

export abstract class BaseAnthropicTool {
	abstract toParams(): Anthropic.Beta.BetaToolUnion;
	abstract run(input: Record<string, any>): Promise<ToolResult>;
}
