import Anthropic from "@anthropic-ai/sdk";
import { BaseAnthropicTool, ToolError, ToolResult } from "./base";
import { bridge } from "../../renderer/window.model";

type Action = "open_url" | "search";

interface BrowserToolOptions {
	default_browser: string;
}

export class BrowserTool extends BaseAnthropicTool {
	name: "browser" = "browser";
	apiType: "browser_20240301" = "browser_20240301";

	constructor() {
		super();
	}

	get options(): BrowserToolOptions {
		return {
			default_browser: "Google Chrome",
		};
	}

	toParams(): Anthropic.Beta.BetaToolUnion {
		return {
			name: this.name,
			type: "custom",
			input_schema: {
				type: "object",
				properties: {
					action: { type: "string", enum: ["open_url", "search"] },
				},
			},
		};
	}

	async run({
		action,
		url,
		query,
	}: {
		action: Action;
		url?: string;
		query?: string;
	}): Promise<ToolResult> {
		if (action === "open_url") {
			if (!url) {
				throw new ToolError("URL is required for open_url action");
			}
			try {
				const result = await bridge.openUrlInChrome(url);
				if (result.success) {
					return {
						output: `Successfully opened URL: ${url}`,
						error: "",
					};
				} else {
					throw new Error(result.error);
				}
			} catch (error) {
				return {
					output: "",
					error: `Failed to open URL: ${error}`,
				};
			}
		}

		if (action === "search") {
			if (!query) {
				throw new ToolError("Query is required for search action");
			}
			try {
				const result = await bridge.searchInChrome(query);
				if (result.success) {
					return {
						output: `Successfully performed search for: ${query}`,
						error: "",
					};
				} else {
					throw new Error(result.error);
				}
			} catch (error) {
				return {
					output: "",
					error: `Failed to perform search: ${error}`,
				};
			}
		}

		throw new ToolError(`Invalid action: ${action}`);
	}
}
