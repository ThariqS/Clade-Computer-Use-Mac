import { Bridge } from "./controller/bridge.model";
import { contextBridge, ipcRenderer } from "electron";

const bridgeInterface: Bridge = {
	execShell: (command: string) =>
		ipcRenderer.invoke("exec-shell-command", command),
	mouseClick: (x: number, y: number, action?: string) =>
		ipcRenderer.invoke("mouse-click", x, y, action),
	keyType: (text: string) => ipcRenderer.invoke("keyboard-type", text),
	keyPress: (keys: string) => ipcRenderer.invoke("keyboard-press", keys),
	takeScreenshot: (width?: number, height?: number) =>
		ipcRenderer.invoke("take-screenshot", width, height),
	getCursorPosition: () => ipcRenderer.invoke("get-cursor-position"),
	getScreenDimensions: () => ipcRenderer.invoke("get-screen-dimensions"),
	mouseClickCurrent: (action?: string) =>
		ipcRenderer.invoke("mouse-click-current", action),
	setAIOperating: (operating: boolean) =>
		ipcRenderer.invoke("set-ai-operating", operating),
	getAIOperating: () => ipcRenderer.invoke("get-ai-operating"),
	getUserPausedOperation: () => ipcRenderer.invoke("get-user-paused-operation"),
	setUserPausedOperation: (paused: boolean) =>
		ipcRenderer.invoke("set-user-paused-operation", paused),
	getLastUserInputTime: () => ipcRenderer.invoke("get-last-user-input-time"),
	onAIOperationPaused: (callback: () => void) =>
		ipcRenderer.on("ai-operation-paused", () => callback()),
	onAIOperationResumed: (callback: () => void) =>
		ipcRenderer.on("ai-operation-resumed", () => callback()),
	getActiveWindowInfo: () => ipcRenderer.invoke("get-active-window-info"),
	openApplication: (appName: string) =>
		ipcRenderer.invoke("open-application", appName),
	openUrlInChrome: (url: string) =>
		ipcRenderer.invoke("open-url-in-chrome", url),
	searchInChrome: (query: string) =>
		ipcRenderer.invoke("search-in-chrome", query),
};

contextBridge.exposeInMainWorld("bridge", bridgeInterface);
