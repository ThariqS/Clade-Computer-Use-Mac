import { ActiveWindowInfo } from "../utils/additionalinfo.models";

export interface Bridge {
	execShell: (command: string) => Promise<{ stdout: string; stderr: string }>;
	mouseClick: (
		x: number,
		y: number,
		action?: string
	) => Promise<{ success: boolean; error?: string }>;
	mouseClickCurrent: (
		action?: string
	) => Promise<{ success: boolean; error?: string }>;
	keyType: (text: string) => Promise<{ success: boolean; error?: string }>;
	keyPress: (keys: string) => Promise<{ success: boolean; error?: string }>;
	takeScreenshot: (
		width?: number,
		height?: number
	) => Promise<{
		success: boolean;
		dataURL?: string;
		error?: string;
	}>;
	getCursorPosition: () => Promise<{
		success: boolean;
		position?: [number, number];
		error?: string;
	}>;
	getScreenDimensions: () => Promise<{ width: number; height: number }>;
	setAIOperating: (operating: boolean) => Promise<void>;
	getAIOperating: () => Promise<boolean>;
	getUserPausedOperation: () => Promise<boolean>;
	setUserPausedOperation: (paused: boolean) => Promise<void>;
	getLastUserInputTime: () => Promise<number>;
	onAIOperationPaused: (callback: () => void) => void;
	onAIOperationResumed: (callback: () => void) => void;
	getActiveWindowInfo: () => Promise<{
		success: boolean;
		info?: ActiveWindowInfo;
		error?: string;
	}>;
	openApplication: (
		appName: string
	) => Promise<{ success: boolean; error?: string }>;
	openUrlInChrome: (
		url: string
	) => Promise<{ success: boolean; error?: string }>;
	searchInChrome: (
		query: string
	) => Promise<{ success: boolean; error?: string }>;
}
