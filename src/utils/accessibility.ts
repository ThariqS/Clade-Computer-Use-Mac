import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function getAccessibleContent(): Promise<string> {
	const script = `
		tell application "System Events"
			set frontApp to first application process whose frontmost is true
			set uiElements to entire contents of frontApp
			set accContent to ""
			repeat with elem in uiElements
				try
					set accContent to accContent & (get name of elem) & ": " & (get description of elem) & "\n"
				end try
			end repeat
			return accContent
		end tell
	`;

	const scriptText = `osascript -e '${script}'`;
	console.log(`scriptText: ${scriptText}`);

	const { stdout, stderr } = await execAsync(scriptText);

	console.log(`stderr: ${stderr}, stdout: ${stdout}`);
	return stdout.trim();
}
