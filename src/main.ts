import {
	app,
	BrowserWindow,
	Tray,
	Menu,
	dialog,
	ipcMain,
	desktopCapturer,
	screen,
} from "electron";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { mouse, keyboard, Point, straightTo, Key } from "@nut-tree-fork/nut-js";
import { uIOhook, UiohookKey } from "uiohook-napi";
import {
	getActiveWindowInfo,
	getCurrentChromePageHtml,
	openApplication,
	openUrlInChrome,
	searchInChrome,
	sendWhatsAppMessage,
	typeChromeInput,
} from "./utils/activeWindow";
import { getAccessibleContent } from "./utils/accessibility";
/*
import MacOSFocusTracker from "./utils/focusTracker";

const tracker = new MacOSFocusTracker();

// Get current focus information
tracker.getFocusInfo().then((info) => {
	console.log("Current focus:", info);
});

// Monitor focus changes
tracker.startMonitoring((info) => {
	console.log("Focus changed:", info);
	console.log("Application:", info.applicationName);
	console.log("Window:", info.windowTitle);
	console.log("Control:", info.role, info.roleDescription);
	console.log("Value:", info.value);
});
*/

//sendWhatsAppMessage("Madinah", "Testing sending from AI");
//getCurrentChromePageHtml();
///typeChromeInput("#search", "Shawarma in Doordash");
//searchInChrome("Shawarma in Doordash");
//Store.initRenderer();
const execAsync = promisify(exec);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
	app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let popupWindow: BrowserWindow | null = null;

// Add this near the top of the file, with other let declarations
let isAIOperating = false;
let userPausedOperation = false;
let lastUserInputTime = Date.now();

/*
const test = async () => {
	// command + N
	console.log("Opening new tabv4");
	await keyboard.pressKey(Key.LeftSuper, Key.N);
	await keyboard.releaseKey(Key.LeftSuper, Key.N);
};
test();
*/

const createHandlers = () => {
	// Set up IPC handlers
	ipcMain.handle("exec-shell-command", async (_, command) => {
		try {
			const { stdout, stderr } = await execAsync(command);
			return { stdout, stderr };
		} catch (error) {
			console.error("Shell command failed:", error);
			throw error;
		}
	});

	ipcMain.handle(
		"mouse-click",
		async (_, x: number, y: number, action?: string) => {
			if (userPausedOperation) {
				console.log("User paused operation, ignoring mouse click");
				return { success: false, error: "User paused operation" };
			}
			try {
				await mouse.move(straightTo(new Point(x, y)));
				switch (action) {
					case "move":
						// For move, we don't need to do anything else
						await mouse.leftClick();
						break;
					case "right_click":
						await mouse.rightClick();
						break;
					case "middle_click":
						await mouse.click(2); // Assuming 2 represents middle click in nut-js
						break;
					case "double_click":
						await mouse.click(2);
						//await mouse.doubleClick();
						break;
					default:
						await mouse.leftClick();
				}
				return { success: true };
			} catch (error) {
				console.error("Mouse action failed:", error);
				return { success: false, error: error.message };
			}
		}
	);

	ipcMain.handle("keyboard-type", async (_, text: string) => {
		if (userPausedOperation) {
			console.log("User paused operation, ignoring keyboard type");
			return { success: false, error: "User paused operation" };
		}
		try {
			// Set a faster typing speed (lower delay between keystrokes)
			keyboard.config.autoDelayMs = 0;
			await mouse.leftClick(); // Make sure we have focus on the right application

			console.log(`Typing text: ${text}`);

			await keyboard.type(text);

			// Reset to default speed after typing
			keyboard.config.autoDelayMs = 300; // or whatever default value you prefer

			return { success: true };
		} catch (error) {
			console.error("Keyboard type failed:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("keyboard-press", async (_, keys: string) => {
		if (userPausedOperation) {
			console.log("User paused operation, ignoring keyboard press");
			return { success: false, error: "User paused operation" };
		}
		try {
			const keySequence = keys.split("+").map((key) => key.trim());
			const nutKeys = keySequence.map((key) => mapToNutKey(key));

			console.log(
				`Pressing keys: ${nutKeys}, keySequence: ${keySequence}, ${keys}`
			);

			if (nutKeys.length > 0) {
				await keyboard.pressKey(...nutKeys);
				await keyboard.releaseKey(...nutKeys);
			} else {
				console.log(`No valid keys to press: ${keys}`);
				return { success: false, error: "No valid keys to press" };
			}
			return { success: true };
		} catch (error) {
			console.error("Keyboard press failed:", error);
			return { success: false, error: error.message };
		}
	});

	// Add this new IPC handler for screenshots
	ipcMain.handle(
		"take-screenshot",
		async (_, width?: number, height?: number) => {
			try {
				console.log(
					`Taking screenshot with width: ${width} and height: ${height}`
				);
				const sources = await desktopCapturer.getSources({
					types: ["screen"],
					thumbnailSize: { width: width || 1920, height: height || 1080 },
				});
				const primaryDisplay = sources[0];
				let thumbnail = primaryDisplay.thumbnail;

				// Scale the image if width and height are provided
				/*
				if (width && height) {
					const scaledThumbnail = thumbnail.resize({ width, height });
					return { success: true, dataURL: scaledThumbnail.toDataURL() };
				}
					*/

				return { success: true, dataURL: thumbnail.toDataURL() };
			} catch (error) {
				console.error("Screenshot failed:", error);
				return { success: false, error: error.message };
			}
		}
	);

	// Add this new IPC handler for getting cursor position
	ipcMain.handle("get-cursor-position", async () => {
		try {
			const position = await mouse.getPosition();
			return { success: true, position: [position.x, position.y] };
		} catch (error) {
			console.error("Get cursor position failed:", error);
			return { success: false, error: error.message };
		}
	});

	// Add this new IPC handler for getting screen dimensions
	ipcMain.handle("get-screen-dimensions", () => {
		const primaryDisplay = screen.getPrimaryDisplay();
		const { width, height } = primaryDisplay.size;
		return { width, height };
	});

	ipcMain.handle("mouse-click-current", async (_, action?: string) => {
		try {
			switch (action) {
				case "right_click":
					await mouse.rightClick();
					break;
				case "middle_click":
					await mouse.click(2); // Assuming 2 represents middle click in nut-js
					break;
				case "double_click":
					await mouse.click(2);
					//await mouse.doubleClick();
					break;
				default:
					await mouse.leftClick();
			}
			return { success: true };
		} catch (error) {
			console.error("Mouse action failed:", error);
			return { success: false, error: error.message };
		}
	});

	// Add these new IPC handlers
	ipcMain.handle("resize-popup-window", (_, width: number, height: number) => {
		resizePopupWindow(width, height);
	});

	ipcMain.handle("get-ai-operating", () => {
		return isAIOperating;
	});

	ipcMain.handle("get-last-user-input-time", () => {
		return lastUserInputTime;
	});

	ipcMain.handle("set-ai-operating", (_, operating: boolean) => {
		isAIOperating = operating;
		console.log(`Setting AI operating to ${operating}`);
		if (operating) {
			resizePopupWindow(600, 200); // Smaller size when AI is operating
		} else {
			resizePopupWindow(600, 400); // Original size when AI is not operating
		}
	});

	ipcMain.handle("get-user-paused-operation", () => {
		return userPausedOperation;
	});

	ipcMain.handle("set-user-paused-operation", (_, paused: boolean) => {
		userPausedOperation = paused;
		if (paused) {
			popupWindow?.webContents.send("ai-operation-paused");
		} else {
			popupWindow?.webContents.send("ai-operation-resumed");
		}
	});

	ipcMain.handle("get-active-window-info", async () => {
		try {
			const windowInfo = await getActiveWindowInfo();
			return { success: true, info: windowInfo };
		} catch (error) {
			console.error("Failed to get active window info:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("open-application", async (_, appName: string) => {
		try {
			await openApplication(appName);
			return { success: true };
		} catch (error) {
			console.error("Failed to open application:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("open-url-in-chrome", async (_, url: string) => {
		try {
			await openUrlInChrome(url);
			return { success: true };
		} catch (error) {
			console.error("Failed to open URL in Chrome:", error);
			return { success: false, error: error.message };
		}
	});

	ipcMain.handle("search-in-chrome", async (_, query: string) => {
		try {
			await searchInChrome(query);
			return { success: true };
		} catch (error) {
			console.error("Failed to search in Chrome:", error);
			return { success: false, error: error.message };
		}
	});
};

const createPopupWindow = () => {
	popupWindow = new BrowserWindow({
		width: 600,
		height: 400,
		show: false,
		frame: false,
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			sandbox: false,
		},
	});

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		popupWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		popupWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
		);
	}

	popupWindow.on("blur", () => {
		if (isAIOperating && !userPausedOperation) {
			console.log("Popup window blurred while AI is operating, not hiding");
			//popupWindow?.show();
		} else {
			console.log("Popup window blurred, AI not operating");
			popupWindow?.hide();
		}
	});

	popupWindow.setAlwaysOnTop(true, "floating");
	popupWindow.setVisibleOnAllWorkspaces(true);
};

const createTray = () => {
	console.log("Creating tray");
	tray = new Tray(path.join(__dirname, "../../", "tray.png"));

	createPopupWindow();

	tray.on("click", (event, bounds) => {
		const { x, y } = bounds;
		const { height: trayHeight } = bounds;
		const { height: windowHeight } = popupWindow.getBounds();
		const yPosition = process.platform === "darwin" ? y : y - windowHeight;

		popupWindow.setPosition(x - 150, yPosition, false);
		popupWindow.isVisible() ? popupWindow.hide() : popupWindow.show();
	});

	tray.setToolTip("Your App Name");
};

const setupGlobalInputHooks = () => {
	uIOhook.on("keydown", (event) => {
		if (
			isAIOperating &&
			!userPausedOperation &&
			event.keycode === UiohookKey.Space
		) {
			userPausedOperation = true;
			lastUserInputTime = Date.now();
			popupWindow?.webContents.send("ai-operation-paused");
		}
	});

	// Start the hook
	uIOhook.start();
};

app.on("ready", () => {
	//createWindow();
	createHandlers();
	createTray();
	setupGlobalInputHooks();
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		//createWindow();
	}
});

// Add this to handle the 'before-quit' event
app.on("before-quit", () => {
	//app.isQuitting = true;
	uIOhook.stop();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const resizePopupWindow = (width: number, height: number) => {
	if (popupWindow) {
		const [x, y] = popupWindow.getPosition();
		popupWindow.setBounds({ x, y, width, height });
	}
};

// Add this function to map string keys to nut-js Key enum
function mapToNutKey(key: string): Key {
	// Handle special cases
	// For single characters, use their uppercase version
	if (key.length === 1) {
		const foundKey = Key[key.toUpperCase() as keyof typeof Key];
		if (foundKey !== undefined) {
			return foundKey;
		}
	}

	if (key.toLowerCase() === "return") {
		return Key.Enter;
	}

	// For other keys, try to match them directly
	const nutKey = Key[key as keyof typeof Key];
	if (nutKey !== undefined) {
		return nutKey;
	}

	switch (key.toLowerCase()) {
		case "ctrl":
			return Key.LeftControl;
		case "alt":
			return Key.LeftAlt;
		case "shift":
			return Key.LeftShift;
		case "win":
		case "cmd":
			return Key.LeftSuper;
		case "command":
			return Key.LeftSuper;
		case "enter":
			return Key.Enter;
		case "space":
			return Key.Space;
		case "escape":
			return Key.Escape;
		case "return":
			return Key.Enter;
		default:
			console.log(`Unsupported key: ${key}`);
			break;
	}

	// If no match found, throw an error
	throw new Error(`Unsupported key: ${key}`);
}
