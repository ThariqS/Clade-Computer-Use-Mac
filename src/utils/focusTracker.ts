// macos-focus-tracker.js
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

// Create a Swift script to monitor focus changes
const swiftScript = `
import Cocoa
import ApplicationServices
import CoreFoundation

// Request accessibility permissions
func requestAccessibility() -> Bool {
    let trusted = kAXTrustedCheckOptionPrompt.takeUnretainedValue()
    let opts = [trusted: true] as CFDictionary
    return AXIsProcessTrustedWithOptions(opts)
}

// Get information about the focused element
func getFocusedElementInfo() -> [String: Any] {
    guard let app = NSWorkspace.shared.frontmostApplication else { return [:] }
    let pid = app.processIdentifier
    
    var focusedElement: AXUIElement?
    var window: AXUIElement?
    
    let appRef = AXUIElementCreateApplication(pid)
    var value: CFTypeRef?
    
    // Get focused window
    AXUIElementCopyAttributeValue(appRef, kAXFocusedWindowAttribute as CFString, &value)
    window = (value as! AXUIElement)
    
    // Get focused element
    AXUIElementCopyAttributeValue(appRef, kAXFocusedUIElementAttribute as CFString, &value)
    focusedElement = (value as! AXUIElement)
    
    var result: [String: Any] = [
        "applicationName": app.localizedName ?? "",
        "bundleIdentifier": app.bundleIdentifier ?? "",
        "processId": pid
    ]
    
    if let element = focusedElement {
        // Get role
        var role: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &role)
        result["role"] = (role as? String) ?? ""
        
        // Get role description
        var roleDesc: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXRoleDescriptionAttribute as CFString, &roleDesc)
        result["roleDescription"] = (roleDesc as? String) ?? ""
        
        // Get value
        var valueStr: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXValueAttribute as CFString, &valueStr)
        result["value"] = (valueStr as? String) ?? ""
        
        // Get title
        var title: CFTypeRef?
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &title)
        result["title"] = (title as? String) ?? ""
    }
    
    if let win = window {
        // Get window title
        var winTitle: CFTypeRef?
        AXUIElementCopyAttributeValue(win, kAXTitleAttribute as CFString, &winTitle)
        result["windowTitle"] = (winTitle as? String) ?? ""
        
        // Get window position
        var position: CFTypeRef?
        AXUIElementCopyAttributeValue(win, kAXPositionAttribute as CFString, &position)
        if let posValue = position as AXValue {
            var point = CGPoint.zero
            AXValueGetValue(posValue, .cgPoint, &point)
            result["windowPosition"] = ["x": point.x, "y": point.y]
        }
    }
    
    return result
}

// Main execution
if !requestAccessibility() {
    print("Error: Accessibility permissions needed")
    exit(1)
}

if let info = try? JSONSerialization.data(withJSONObject: getFocusedElementInfo(), options: []) {
    print(String(data: info, encoding: .utf8) ?? "{}")
}
`;

class MacOSFocusTracker {
	swiftScriptPath: string;
	initialized: boolean;

	constructor() {
		this.swiftScriptPath = "/tmp/focus_tracker.swift";
		this.initialized = false;
	}

	async initialize() {
		try {
			// Save Swift script to temporary file
			const fs = require("fs").promises;
			await fs.writeFile(this.swiftScriptPath, swiftScript);

			// Compile Swift script
			await exec(
				`swiftc ${this.swiftScriptPath} -o ${this.swiftScriptPath}.out`
			);
			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize focus tracker:", error);
			throw error;
		}
	}

	async getFocusInfo() {
		if (!this.initialized) {
			await this.initialize();
		}

		try {
			const { stdout } = await exec(`${this.swiftScriptPath}.out`);
			return JSON.parse(stdout);
		} catch (error) {
			if (error.message.includes("Accessibility permissions needed")) {
				console.error(
					"Please grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility"
				);
			}
			throw error;
		}
	}

	async startMonitoring(callback: (info: any) => void, interval = 1000) {
		if (!this.initialized) {
			await this.initialize();
		}

		let lastInfo: any = null;

		setInterval(async () => {
			try {
				const currentInfo = await this.getFocusInfo();

				// Only call callback if focus has changed
				if (JSON.stringify(currentInfo) !== JSON.stringify(lastInfo)) {
					callback(currentInfo);
					lastInfo = currentInfo;
				}
			} catch (error) {
				console.error("Error monitoring focus:", error);
			}
		}, interval);
	}
}

export default MacOSFocusTracker;
