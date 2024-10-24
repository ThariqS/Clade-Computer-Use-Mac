import { DateTime } from "luxon";
import Anthropic from "@anthropic-ai/sdk";
import {
	//BashTool,
	ComputerTool,
	//EditTool,
	ToolCollection,
	ToolResult,
} from "./tools/index";
import { bridge } from "../renderer/window.model";
import { WindowTool } from "./tools/window";
import { BrowserTool } from "./tools/browser";
import { ReasoningTool } from "./tools/reasoning";

const BETA_FLAG = "computer-use-2024-10-22";

export enum APIProvider {
	ANTHROPIC = "anthropic",
	BEDROCK = "bedrock",
	VERTEX = "vertex",
}

export const PROVIDER_TO_DEFAULT_MODEL_NAME: Record<APIProvider, string> = {
	[APIProvider.ANTHROPIC]: "claude-3-5-sonnet-20241022",
	[APIProvider.BEDROCK]: "anthropic.claude-3-5-sonnet-20241022-v2:0",
	[APIProvider.VERTEX]: "claude-3-5-sonnet-v2@20241022",
};

/*
 * Using bash tool you can start GUI applications, but you need to set export DISPLAY=:1 and use a subshell. For example "(DISPLAY=:1 xterm &)". GUI apps run with bash tool will appear within your desktop environment, but they may take some time to appear. Take a screenshot to confirm it did.
 * When using your bash tool with commands that are expected to output very large quantities of text, redirect into a tmp file and use str_replace_editor or \`grep -n -B <lines before> -A <lines after> <query> <filename>\` to confirm output.
 */

const SYSTEM_PROMPT = `<SYSTEM_CAPABILITY>
* You are utilising an MAC OSX virtual machine with internet access.
* You can open applications with your window tool.
* Your browser tool can open URLs in Chrome and perform searches.
* * Use the reasoning tool to help you make decisions and reflect on your actions.
* When viewing a page it can be helpful to zoom out so that you can see everything on the page.  Either that, or make sure you scroll down to see everything before deciding something isn't available.
* When using your computer function calls, they take a while to run and send back to you.  Where possible/feasible, try to chain multiple of these calls all into one function calls request.
* The current date is ${DateTime.now().toFormat("cccc, MMMM d, yyyy")}.
* When using the calendar app, use the "+" button to add an event and use the quick event option to add an event without having to fill in the details manually, e.g. "tomorrow 10am"
</SYSTEM_CAPABILITY>

<IMPORTANT>
* You should use the browser tool and window tool instead of the computer tool whenever possible, because they are more likely to be accurate.
* If you are ever confused about what to do, use the reasoning tool to help you decide.
* Always respond in Markdown format.
* You should use keyboard shortcuts often, but remember this is MAC OSX, so use the command key when needed.
* ALWAYS take a screenshot after you open a new application to confirm the state is in.
* You have full access to Chrome, and can navigate to any URL you want, including the users logged in state.
* You have access to the users logged in state and can perform useful actions for them like sending emails, reading emails, ordering food, and booking flights, etc.
* ALWAYS try and complete a task by navigating to the right application and trying a few things, but if you absolutely can't, only then ask the user for help.
* Think step by step before you act in what might need to get done.
* You make mistakes OFTEN by clicking on the wrong thing. If something seems wrong, check to see if you are on the correct page before proceeding to make sure you clicked on the right thing. If you have not, you should correct it.
* ALWAYS take a screenshot at the end of your task to confirm you have completed it correctly, if not continue to try and fix it.
* Before typing, always make sure you have focus on the right application.
</IMPORTANT>`;

interface SamplingLoopOptions {
	model: string;
	provider: APIProvider;
	systemPromptSuffix: string;
	messages: Anthropic.Beta.BetaMessageParam[];
	outputCallback: (block: Anthropic.Beta.BetaContentBlock) => void;
	toolOutputCallback: (result: ToolResult, id: string) => void;
	apiResponseCallback: (response: Anthropic.Beta.BetaMessage) => void;
	apiKey: string;
	onlyNMostRecentImages?: number;
	maxTokens?: number;
}

export async function samplingLoop({
	model,
	provider,
	systemPromptSuffix,
	messages,
	outputCallback,
	toolOutputCallback,
	apiResponseCallback,
	apiKey,
	onlyNMostRecentImages = null,
	maxTokens = 4096,
}: SamplingLoopOptions): Promise<Anthropic.Beta.BetaMessageParam[]> {
	const toolCollection = new ToolCollection(
		new ComputerTool(),
		new WindowTool(),
		new BrowserTool(),
		new ReasoningTool()
		//new BashTool()
		//new EditTool()
	);

	console.log("Tool Collection", toolCollection.toParams());

	while (true) {
		console.log("Running Loop");
		if (onlyNMostRecentImages) {
			maybeFilterToNMostRecentImages(messages, onlyNMostRecentImages);
		}
		const activeWindowInfo = await bridge.getActiveWindowInfo();

		let client;
		client = new Anthropic({
			apiKey,
			dangerouslyAllowBrowser: true,
		});

		const system = `${SYSTEM_PROMPT}${
			systemPromptSuffix ? " " + systemPromptSuffix : ""
		}.

		<SYSTEM_STATE>
		* The current active application is ${activeWindowInfo.info.activeApplication} (but you may not have focus on it).
		* The other apps open that you can focus are: ${activeWindowInfo.info.openApplications.join(
			", "
		)}. You can use your window tool to open them.
		${
			activeWindowInfo.info.chrome &&
			`* The current URL is ${activeWindowInfo.info.chrome.activeURL}.`
		}
		</SYSTEM_STATE>
		`;

		/*
		switch (provider) {
			case APIProvider.ANTHROPIC:
				client = new Anthropic({ apiKey });
				break;
			case APIProvider.VERTEX:
				client = new AnthropicVertex();
				break;
			case APIProvider.BEDROCK:
				client = new AnthropicBedrock();
				break;
		}
				*/

		const response = await client.beta.messages.create({
			max_tokens: maxTokens,
			messages,
			model,
			system,
			tools: toolCollection.toParams(),
			betas: [BETA_FLAG],
		});

		apiResponseCallback(response);

		const assistantContent: Anthropic.Beta.BetaContentBlockParam[] =
			response.content as Anthropic.Beta.BetaContentBlockParam[];

		messages.push({
			role: "assistant",
			content: assistantContent,
		});

		const toolResultContent: Anthropic.Beta.BetaToolResultBlockParam[] = [];

		for (const contentBlock of response.content as Anthropic.Beta.BetaContentBlock[]) {
			outputCallback(contentBlock);
			if (contentBlock.type === "tool_use") {
				const result = await toolCollection.run(
					contentBlock.name,
					contentBlock.input as Record<string, any>
				);
				toolResultContent.push(makeApiToolResult(result, contentBlock.id));
				toolOutputCallback(result, contentBlock.id);
			}
		}

		// Always add the tool results, even if there are no other tool uses
		messages.push({ content: toolResultContent, role: "user" });

		if (toolResultContent.length === 0) {
			return messages;
		}
	}
}

function maybeFilterToNMostRecentImages(
	messages: Anthropic.Beta.BetaMessageParam[],
	imagesToKeep: number,
	minRemovalThreshold: number = 10
): void {
	if (imagesToKeep === null) {
		return;
	}

	const toolResultBlocks = messages
		.flatMap((message) =>
			Array.isArray(message.content) ? message.content : []
		)
		.filter(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				(item as any).type === "tool_result"
		) as Anthropic.Beta.BetaToolResultBlockParam[];

	let totalImages = toolResultBlocks.reduce(
		(sum, toolResult) =>
			sum +
			(Array.isArray(toolResult.content)
				? toolResult.content.filter(
						(content) =>
							typeof content === "object" &&
							content !== null &&
							(content as any).type === "image"
					).length
				: 0),
		0
	);

	let imagesToRemove = totalImages - imagesToKeep;
	imagesToRemove -= imagesToRemove % minRemovalThreshold;

	for (const toolResult of toolResultBlocks) {
		if (Array.isArray(toolResult.content)) {
			toolResult.content = toolResult.content.filter((content) => {
				if (
					typeof content === "object" &&
					content !== null &&
					(content as any).type === "image"
				) {
					if (imagesToRemove > 0) {
						imagesToRemove--;
						return false;
					}
				}
				return true;
			});
		}
	}
}

function makeApiToolResult(
	result: ToolResult,
	toolUseId: string
): Anthropic.Beta.BetaToolResultBlockParam {
	const toolResultContent: (
		| Anthropic.Beta.BetaTextBlockParam
		| Anthropic.Beta.BetaImageBlockParam
	)[] = [];
	let isError = false;

	if (result.error) {
		isError = true;
		toolResultContent.push({
			type: "text",
			text: maybePrependSystemToolResult(result, result.error),
		});
	} else {
		if (result.output) {
			toolResultContent.push({
				type: "text",
				text: maybePrependSystemToolResult(result, result.output),
			});
		}
		if (result.base64Image) {
			toolResultContent.push({
				type: "image",
				source: {
					type: "base64",
					media_type: "image/png",
					data: result.base64Image,
				},
			});
		}
	}

	return {
		type: "tool_result",
		content: toolResultContent,
		tool_use_id: toolUseId,
		is_error: isError,
	};
}

function maybePrependSystemToolResult(
	result: ToolResult,
	resultText: string
): string {
	if (result.system) {
		return `<system>${result.system}</system>\n${resultText}`;
	}
	return resultText;
}
