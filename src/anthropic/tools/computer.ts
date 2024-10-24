import Anthropic from "@anthropic-ai/sdk";
import { bridge } from "../../renderer/window.model";
import { BaseAnthropicTool, ToolError, ToolResult } from "./base";

type Action =
	| "key"
	| "type"
	| "mouse_move"
	| "left_click"
	| "left_click_drag"
	| "right_click"
	| "middle_click"
	| "double_click"
	| "screenshot"
	| "cursor_position";

interface Resolution {
	width: number;
	height: number;
}

const MAX_SCALING_TARGETS: Record<string, Resolution> = {
	XGA: { width: 1024, height: 768 },
	WXGA: { width: 1280, height: 800 },
	FWXGA: { width: 1366, height: 768 },
};

enum ScalingSource {
	COMPUTER = "computer",
	API = "api",
}

const OUTPUT_DIR = "/tmp/outputs";

const TYPING_DELAY_MS = 12;
const TYPING_GROUP_SIZE = 50;

interface ComputerToolOptions {
	display_height_px: number;
	display_width_px: number;
	display_number: number | null;
}

let screenWidth = 1920; // Default value
let screenHeight = 1080; // Default value

// Immediately invoke an async function to fetch screen dimensions
(async () => {
	try {
		const dimensions = await bridge.getScreenDimensions();
		screenWidth = dimensions.width;
		screenHeight = dimensions.height;
		console.log(`Screen dimensions: ${screenWidth}x${screenHeight}`);
	} catch (error) {
		console.error("Failed to get screen dimensions:", error);
	}
})();

export class ComputerTool extends BaseAnthropicTool {
	name: "computer" = "computer";
	apiType: "computer_20241022" = "computer_20241022";
	displayNum: number | null;

	private screenshotDelay = 2.0;
	private scalingEnabled = true;
	private maxScalingTargets: Record<string, Resolution> = {
		XGA: { width: 1024, height: 768 },
		WXGA: { width: 1280, height: 800 },
		FWXGA: { width: 1366, height: 768 },
	};
	private displayPrefix: string;
	private xdotool: string;

	constructor() {
		super();
		const displayNum = "1";
		if (displayNum !== undefined) {
			this.displayNum = parseInt(displayNum, 10);
			this.displayPrefix = `DISPLAY=:${this.displayNum} `;
		} else {
			this.displayNum = null;
			this.displayPrefix = "";
		}
		this.xdotool = `${this.displayPrefix}xdotool`;
	}

	get options(): ComputerToolOptions {
		const [width, height] = this.scaleCoordinates(
			ScalingSource.COMPUTER,
			screenWidth,
			screenHeight
		);
		return {
			display_width_px: width,
			display_height_px: height,
			display_number: this.displayNum,
		};
	}

	toParams(): Anthropic.Beta.BetaToolComputerUse20241022 {
		return { name: this.name, type: this.apiType, ...this.options };
	}

	async run({
		action,
		text,
		coordinate,
		...kwargs
	}: {
		action: Action;
		text?: string;
		coordinate?: [number, number];
	}): Promise<ToolResult> {
		const isClick = [
			"left_click",
			"right_click",
			"double_click",
			"middle_click",
		].includes(action);

		if (action === "mouse_move" || (isClick && coordinate)) {
			if (!coordinate) {
				throw new ToolError(`coordinate is required for ${action}`);
			}
			const [x, y] = this.scaleCoordinates(
				ScalingSource.API,
				coordinate[0],
				coordinate[1]
			);

			if (action === "mouse_move") {
				// Use bridge.mouseClick with 'move' parameter
				const result = await bridge.mouseClick(x, y, "move");
				return {
					output: result.success
						? "Mouse move successful"
						: "Mouse move failed",
					error: result.error || "",
				};
			} else {
				const result = await bridge.mouseClick(x, y);
				return {
					output: result.success ? "Click successful" : "Click failed",
					error: result.error || "",
				};
			}
		}

		if (action === "type") {
			if (text === undefined) {
				throw new ToolError("text is required for type action");
			}
			if (coordinate !== undefined) {
				throw new ToolError("coordinate is not accepted for type action");
			}
			if (typeof text !== "string") {
				throw new ToolError(`${text} must be a string`);
			}

			const result = await bridge.keyType(text);
			return {
				output: result.success ? "Type successful" : "Type failed",
				error: result.error || "",
			};
		}

		if (action === "key") {
			if (text === undefined) {
				throw new ToolError("text is required for key action");
			}
			if (coordinate !== undefined) {
				throw new ToolError("coordinate is not accepted for key action");
			}
			if (typeof text !== "string") {
				throw new ToolError(`${text} must be a string`);
			}

			const result = await bridge.keyPress(text);
			return {
				output: result.success ? "Key press successful" : "Key press failed",
				error: result.error || "",
			};
		}

		if (isClick && coordinate === undefined) {
			if (text !== undefined) {
				throw new ToolError(`text is not accepted for ${action}`);
			}
			if (coordinate !== undefined) {
				throw new ToolError(`coordinate is not accepted for ${action}`);
			}

			const result = await bridge.mouseClickCurrent(action);
			return {
				output: result.success ? `${action} successful` : `${action} failed`,
				error: result.error || "",
			};
		}

		if (action === "screenshot") {
			return this.screenshot();
		}

		if (action === "cursor_position") {
			const result = await bridge.getCursorPosition();
			if (result.success) {
				const [x, y] = result.position;
				const [scaledX, scaledY] = this.scaleCoordinates(
					ScalingSource.COMPUTER,
					x,
					y
				);
				return { output: `X=${scaledX},Y=${scaledY}`, error: "" };
			} else {
				return {
					output: "",
					error: result.error || "Failed to get cursor position",
				};
			}
		}

		throw new ToolError(`Invalid action: ${action}`);
	}

	private async screenshot(): Promise<ToolResult> {
		try {
			const [scaledWidth, scaledHeight] = this.scaleCoordinates(
				ScalingSource.COMPUTER,
				screenWidth,
				screenHeight
			);

			const result = await bridge.takeScreenshot(scaledWidth, scaledHeight);
			if (result.success && result.dataURL) {
				const base64Image = result.dataURL.split(",")[1];
				return {
					output: "Screenshot taken successfully",
					error: "",
					base64Image,
				};
			} else {
				throw new Error(result.error || "Screenshot failed");
			}
		} catch (error) {
			throw new ToolError(`Failed to take screenshot: ${error}`);
		}
	}

	private chunks(s: string, chunkSize: number): string[] {
		const chunks: string[] = [];
		for (let i = 0; i < s.length; i += chunkSize) {
			chunks.push(s.slice(i, i + chunkSize));
		}
		return chunks;
	}

	private scaleCoordinates(
		source: ScalingSource,
		x: number,
		y: number
	): [number, number] {
		if (!this.scalingEnabled) {
			return [x, y];
		}

		const ratio = screenWidth / screenHeight;
		let targetDimension: Resolution | null = null;

		for (const dimension of Object.values(this.maxScalingTargets)) {
			if (Math.abs(dimension.width / dimension.height - ratio) < 0.02) {
				if (dimension.width < screenWidth) {
					targetDimension = dimension;
					break;
				}
			}
		}

		if (targetDimension === null) {
			return [x, y];
		}

		const xScalingFactor = targetDimension.width / screenWidth;
		const yScalingFactor = targetDimension.height / screenHeight;

		if (source === ScalingSource.API) {
			if (x > screenWidth || y > screenHeight) {
				throw new ToolError(`Coordinates ${x}, ${y} are out of bounds`);
			}
			// Scale up
			return [Math.round(x / xScalingFactor), Math.round(y / yScalingFactor)];
		}
		// Scale down
		return [Math.round(x * xScalingFactor), Math.round(y * yScalingFactor)];
	}

	// Other methods like screenshot, shell, etc. would be implemented here
}
