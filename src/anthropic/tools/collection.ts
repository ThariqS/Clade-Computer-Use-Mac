import Anthropic from "@anthropic-ai/sdk";
import { BaseAnthropicTool, ToolError, ToolFailure, ToolResult } from "./base";

export class ToolCollection {
	private tools: BaseAnthropicTool[];
	private toolMap: Map<string, BaseAnthropicTool>;

	constructor(...tools: BaseAnthropicTool[]) {
		this.tools = tools;
		this.toolMap = new Map(tools.map((tool) => [tool.toParams().name, tool]));
	}

	toParams(): Anthropic.Beta.BetaToolUnion[] {
		return this.tools.map((tool) => tool.toParams());
	}

	async run(name: string, toolInput: Record<string, any>): Promise<ToolResult> {
		const tool = this.toolMap.get(name);
		if (!tool) {
			return new ToolFailure(`Tool ${name} is invalid`);
		}
		try {
			return await tool.run(toolInput);
		} catch (error) {
			if (error instanceof ToolError) {
				return new ToolFailure(error.message);
			}
			throw error;
		}
	}
}
