import { exec } from "child_process";
import { promisify } from "util";
import { ChromeTab, ActiveWindowInfo } from "./additionalinfo.models";

const execAsync = promisify(exec);

export async function sendWhatsAppMessage(
	contact: string,
	message: string
): Promise<void> {
	const messageChunks = message.match(/.{1,3}/g) || [];

	const script = `
    delay 0.5
    tell application "WhatsApp" to activate
    delay 1 -- Wait for the app to fully activate
    
    tell application "System Events"
      -- Ensure WhatsApp is the frontmost application
      set frontApp to name of first application process whose frontmost is true
      if frontApp is not "WhatsApp" then
        key code 53 -- Escape key, to deselect any text
        delay 0.5
        tell application "WhatsApp" to activate
        delay 0.5
      end if
      
      -- Open new chat
      keystroke "n" using command down
      delay 0.5
      
      -- Ensure focus is on the search field
      keystroke tab
      delay 0.2
      keystroke tab
      delay 0.2
      
      -- Type contact name
      keystroke "${contact}"
      delay 1
      keystroke return
      delay 1
      
      -- Ensure focus is on the message input field
      keystroke tab
      delay 1.5
      
      -- Type and send message chunks
      ${messageChunks
				.map(
					(chunk) => `
        keystroke "${chunk.replace(/"/g, '\\"')}"
        delay 0.5
      `
				)
				.join("")}
      keystroke return
    end tell
  `;

	try {
		await execAsync(`osascript -e '${script}'`);
		console.log(`Sent WhatsApp message to ${contact}`);
	} catch (error) {
		console.error("Error sending WhatsApp message:", error);
		throw error;
	}
}

export async function clickChromeElement(
	elementIdentifier: string
): Promise<void> {
	const script = `
    tell application "Google Chrome"
      activate
      set frontWindow to front window
      tell frontWindow
        tell active tab
          execute javascript "
            function findElementByAccessibility(identifier) {
              // Try to find by aria-label
              let element = document.querySelector('[aria-label=\"' + identifier + '\"]');
              if (element) return element;
              
              // Try to find by id
              element = document.getElementById(identifier);
              if (element) return element;
              
              // Try to find by text content
              const elements = document.getElementsByTagName('*');
              for (let el of elements) {
                if (el.textContent.trim() === identifier) return el;
              }
              
              return null;
            }
            
            const element = findElementByAccessibility('${elementIdentifier}');
            if (element) {
              element.click();
              return true;
            }
            return false;
          "
        end tell
      end tell
    end tell
  `;

	try {
		await execAsync(`osascript -e '${script}'`);
	} catch (error) {
		console.error(
			`Error clicking Chrome element (${elementIdentifier}):`,
			error
		);
		throw error;
	}
}

export async function typeChromeInput(
	selector: string,
	text: string
): Promise<void> {
	const script = `
    tell application "Google Chrome"
      activate
      set frontWindow to front window
      tell frontWindow
        execute javascript "
          function typeInput(selector, text) {
            const element = document.querySelector(selector);
            if (element && element.tagName === 'INPUT') {
              element.value = text;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          }
          typeInput('${selector}', '${text.replace(/'/g, "\\'")}');
        "
      end tell
    end tell
  `;

	try {
		await execAsync(`osascript -e '${script}'`);
	} catch (error) {
		console.error(`Error typing into Chrome input (${selector}):`, error);
		throw error;
	}
}

export async function getCurrentChromePageHtml(): Promise<string> {
	const script = `
    tell application "Google Chrome"
      set currentTab to active tab of front window
      execute currentTab javascript "document.documentElement.outerHTML"
    end tell
  `;

	try {
		const { stdout } = await execAsync(`osascript -e '${script}'`);
		console.log("Current Chrome page HTML:", stdout.trim());
		return stdout.trim();
	} catch (error) {
		console.error("Error getting current Chrome page HTML:", error);
		throw error;
	}
}

export async function openUrlInChrome(url: string): Promise<void> {
	const script = `
    tell application "Google Chrome"
      activate
      open location "${url}"
    end tell
  `;

	try {
		await execAsync(`osascript -e '${script}'`);
	} catch (error) {
		console.error("Error opening URL in Chrome:", error);
		throw error;
	}
}

export async function searchInChrome(query: string): Promise<void> {
	// Encode the query to handle special characters
	const encodedQuery = encodeURIComponent(query);
	const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;

	const script = `
    tell application "Google Chrome"
      activate
      open location "${searchUrl}"
    end tell
  `;

	try {
		await execAsync(`osascript -e '${script}'`);
	} catch (error) {
		console.error("Error searching in Chrome:", error);
		throw error;
	}
}

// New function to get all open applications
export async function getAllOpenApplications(): Promise<string[]> {
	switch (process.platform) {
		case "darwin":
			const allAppsCommand = `osascript -e 'tell application "System Events" to get name of every process whose background only is false'`;
			const { stdout: allAppsOutput } = await execAsync(allAppsCommand);
			return allAppsOutput.split(", ").map((app) => app.trim());
		default:
			return [];
	}
}

export async function getActiveWindowInfo(): Promise<ActiveWindowInfo> {
	switch (process.platform) {
		case "win32":
			return getActiveWindowInfoWindows();
		case "darwin":
			return getActiveWindowInfoMacOS();
		case "linux":
			return getActiveWindowInfoLinux();
		default:
			throw new Error("Unsupported operating system");
	}
}

async function getActiveWindowInfoWindows(): Promise<ActiveWindowInfo> {
	const titleCommand = `powershell -command "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty MainWindowTitle"`;
	const { stdout: title } = await execAsync(titleCommand);

	if (title.toLowerCase().includes("chrome")) {
		const urlCommand = `powershell -command "$chrome = Get-Process chrome | Where-Object {$_.MainWindowTitle -ne ''}; $handle = $chrome.MainWindowHandle; Add-Type -AssemblyName UIAutomationClient; $automation = [System.Windows.Automation.AutomationElement]::FromHandle($handle); $urlBar = $automation.FindFirst([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty, 'Address and search bar')); $urlBar.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern).Current.Value"`;
		const { stdout: url } = await execAsync(urlCommand);
		return {
			activeApplication: title.trim(),
			chrome: { activeURL: url.trim(), allURLs: [] },
			openApplications: [],
		};
	}

	return {
		activeApplication: title.trim(),
		chrome: { activeURL: "", allURLs: [] },
		openApplications: [],
	};
}

async function getActiveWindowInfoMacOS(): Promise<ActiveWindowInfo> {
	const titleCommand = `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`;
	const { stdout: title } = await execAsync(titleCommand);

	const openApplications = await getAllOpenApplications();

	if (title.toLowerCase().includes("chrome")) {
		const urlCommand = `osascript -e 'tell application "Google Chrome" to get URL of active tab of front window'`;
		const { stdout: url } = await execAsync(urlCommand);
		const allURLs = await getAllChromeTabs();
		return {
			activeApplication: title.trim(),
			chrome: { activeURL: url.trim(), allURLs: allURLs },
			openApplications: openApplications,
		};
	}

	return {
		activeApplication: title.trim(),
		chrome: { activeURL: "", allURLs: [] },
		openApplications: openApplications,
	};
}

// New function to open an application
export async function openApplication(appName: string): Promise<void> {
	const command = `osascript -e 'tell application "${appName}" to activate'`;
	await execAsync(command);
}

// New function to focus an already open application
export async function focusApplication(appName: string): Promise<void> {
	const command = `osascript -e '
    tell application "System Events"
      set frontmost of process "${appName}" to true
    end tell'`;
	await execAsync(command);
}

async function getActiveWindowInfoLinux(): Promise<ActiveWindowInfo> {
	const titleCommand = `xdotool getactivewindow getwindowname`;
	const { stdout: title } = await execAsync(titleCommand);

	if (title.toLowerCase().includes("chrome")) {
		// This is a more complex operation on Linux and may require additional setup
		const urlCommand = `xdotool getactivewindow windowfocus key --clearmodifiers ctrl+l ctrl+c; xclip -o -selection clipboard`;
		await execAsync(urlCommand);
		const { stdout: url } = await execAsync("xclip -o -selection clipboard");
		return {
			activeApplication: title.trim(),
			chrome: { activeURL: url.trim(), allURLs: [] },
			openApplications: [],
		};
	}

	return {
		activeApplication: title.trim(),
		chrome: { activeURL: "", allURLs: [] },
		openApplications: [],
	};
}

export async function getAllChromeTabs(): Promise<ChromeTab[]> {
	return [];
	/*
	const script = `
		tell application "Google Chrome"
			set tabData to {}
			set windowList to every window
			repeat with theWindow in windowList
				set tabList to every tab of theWindow
				repeat with theTab in tabList
					set end of tabData to {title:title of theTab, url:URL of theTab}
				end repeat
			end repeat
			return tabData
		end tell
	`;

	try {
		const { stdout } = await execAsync(`osascript -e '${script}'`);
		const tabsString = stdout.trim();

		// Parse the output string into an array of ChromeTab objects
		const tabs: ChromeTab[] = tabsString
			.slice(1, -1) // Remove the outer parentheses
			.split(/,\s*(?={)/) // Split by comma followed by opening brace
			.map((tabStr) => {
				const [title, url] = tabStr
					.slice(1, -1) // Remove the curly braces
					.split(", ")
					.map((str) => str.split(":")[1].trim().replace(/^"|"$/g, "")); // Extract value and remove quotes
				return { title, url };
			});

		return tabs;
	} catch (error) {
		console.error("Error getting Chrome tabs:", error);
		return [];
	}
        */
}
