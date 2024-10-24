import Anthropic from "@anthropic-ai/sdk";
import { BaseAnthropicTool, ToolResult } from "./base";

export class ReasoningTool extends BaseAnthropicTool {
	name: "reasoning" = "reasoning";
	apiType: "reasoning_20241022" = "reasoning_20241022";

	constructor() {
		super();
	}

	toParams(): Anthropic.Beta.BetaToolUnion {
		return {
			name: this.name,
			type: "custom",
			input_schema: {
				type: "object",
				properties: {
					action: {
						type: "string",
						enum: ["askUserQuestion", "confirmAction", "reflectOnConfusion"],
					},
					options: {
						type: "array",
						items: { type: "string" },
						description: "If you need to ask the user a question.",
					},
					action_to_confirm: {
						type: "string",
						description:
							"When you are doing a potentially irreversible action and need to confirm with the user such as sending a message or making a purchase.",
					},
					description: {
						type: "string",
						description:
							"When you are confused and need to reflect on why you are confused.",
					},
				},
				required: ["action"],
			},
		};
	}

	async run(input: Record<string, any>): Promise<ToolResult> {
		const { action, ...params } = input;
		switch (action) {
			case "askUserQuestion":
				return this.askUserQuestion(params.options);
			case "confirmAction":
				return this.confirmAction(params.action_to_confirm);
			case "reflectOnConfusion":
				return this.reflectOnConfusion(params.description);
			default:
				throw new Error(`Unknown action: ${action}`);
		}
	}

	private async askUserQuestion(options: string[]): Promise<ToolResult> {
		console.log(
			`[ReasoningTool] askUserQuestion called with options: ${options.join(", ")}`
		);
		// Stub: Always return the first option
		return {
			output: options[0],
			error: "",
		};
	}

	private async confirmAction(action: string): Promise<ToolResult> {
		console.log(`[ReasoningTool] confirmAction called with action: ${action}`);
		// Stub: Always confirm the action
		return {
			output: "Action confirmed",
			error: "",
		};
	}

	private async reflectOnConfusion(description: string): Promise<ToolResult> {
		console.log(
			`[ReasoningTool] reflectOnConfusion called with description: ${description}`
		);
		// Stub: Return a generic reflection
		return {
			output:
				"Reflection completed: The AI has considered the confusion and is ready to proceed.",
			error: "",
		};
	}
}
