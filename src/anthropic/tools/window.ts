import Anthropic from "@anthropic-ai/sdk";
import { bridge } from "../../renderer/window.model";
import { BaseAnthropicTool, ToolError, ToolResult } from "./base";

type Action = "activate_app";

export class WindowTool extends BaseAnthropicTool {
	name: "window" = "window";
	apiType: "window_20240301" = "window_20240301";

	constructor() {
		super();
	}

	toParams(): Anthropic.Beta.BetaToolUnion {
		return {
			name: "window",
			type: "custom",
			input_schema: {
				type: "object",
				properties: {
					action: { type: "string", enum: ["activate_app"] },
					app_name: { type: "string" },
				},
				required: ["action"],
			},
		};
	}

	async run({
		action,
		app_name,
	}: {
		action: Action;
		app_name?: string;
	}): Promise<ToolResult> {
		if (action === "activate_app") {
			if (!app_name) {
				throw new ToolError("app_name is required for activate_app action");
			}

			const result = await bridge.openApplication(app_name);
			return {
				output: result.success
					? `Activated ${app_name}`
					: `Failed to activate ${app_name}`,
				error: result.error || "",
			};
		}

		throw new ToolError(`Invalid action: ${action}`);
	}
}
