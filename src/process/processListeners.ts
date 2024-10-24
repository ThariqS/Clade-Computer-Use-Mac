import { BrowserWindow, dialog, ipcMain } from "electron";
import { Low } from "lowdb/lib";
import { JSONFilePreset } from "lowdb/node";
import { ATOMID, AtomTypeMap } from "../models/atoms";

let window: BrowserWindow | null = null;
let db: Low<any> | null = null;

interface DatabaseData {
	currentPath: string;
	projects: Record<string, any>;
}

export async function initDataStore() {
	// Read or create db.json
	const defaultData: DatabaseData = { currentPath: "", projects: {} };
	db = await JSONFilePreset<DatabaseData>("db7.json", defaultData);
	console.log("db initialized", db.data);
}

export async function initProcessListeners(_window: BrowserWindow) {
	await initDataStore();
	window = _window;
	/*
	ipcMain.handle("exec-shell", (event: Electron.IpcMainEvent, command: string) => {
		console.log("exec-shell", command);
		return "test";
	});
	*/

	if (!db) {
		console.error("db is not initialized");
		return;
	}
}
