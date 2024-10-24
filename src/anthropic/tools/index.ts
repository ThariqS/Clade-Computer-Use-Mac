// Export the tool classes
//export { BashTool } from "./bash";
export { ComputerTool } from "./computer";
//export { EditTool } from "./edit";

// Export the ToolCollection class
export { ToolCollection } from "./collection";

// Export the ToolResult interface
export interface ToolResult {
	error?: string;
	output?: string;
	base64Image?: string;
	system?: string;
}
