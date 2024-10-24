/*
import Anthropic from "@anthropic-ai/sdk";
import { BaseAnthropicTool, ToolError, ToolResult } from "./base";
import { spawn } from "child_process";

class BashSession {
	private started: boolean = false;
	private process: any; // This would be the Node.js child process
	private command: string = "/bin/bash";
	private outputDelay: number = 0.2; // seconds
	private timeout: number = 120.0; // seconds
	private sentinel: string = "<<exit>>";

	async start(): Promise<void> {
		if (this.started) return;

		this.process = spawn(this.command, {
			shell: true,
			stdio: ["pipe", "pipe", "pipe"],
		});

		this.started = true;
	}

	stop(): void {
		if (!this.started) {
			throw new ToolError("Session has not started.");
		}
		if (this.process.exitCode !== null) return;
		this.process.kill();
	}

	async run(command: string): Promise<ToolResult> {
		if (!this.started) {
			throw new ToolError("Session has not started.");
		}
		if (this.process.exitCode !== null) {
			return {
				system: "tool must be restarted",
				error: `bash has exited with returncode ${this.process.exitCode}`,
			};
		}

		return new Promise((resolve, reject) => {
			let output = "";
			let error = "";
			let timeoutId: NodeJS.Timeout;

			const cleanupAndResolve = () => {
				clearTimeout(timeoutId);
				if (output.endsWith("\n")) {
					output = output.slice(0, -1);
				}
				if (error.endsWith("\n")) {
					error = error.slice(0, -1);
				}
				resolve({ output, error });
			};

			this.process.stdout.on("data", (data: Buffer) => {
				output += data.toString();
				if (output.includes(this.sentinel)) {
					output = output.slice(0, output.indexOf(this.sentinel));
					cleanupAndResolve();
				}
			});

			this.process.stderr.on("data", (data: Buffer) => {
				error += data.toString();
			});

			timeoutId = setTimeout(() => {
				reject(
					new ToolError(
						`timed out: bash has not returned in ${this.timeout} seconds and must be restarted`
					)
				);
			}, this.timeout * 1000);

			this.process.stdin.write(`${command}; echo '${this.sentinel}'\n`);
		});
	}
}

export class BashTool extends BaseAnthropicTool {
	private session: BashSession | null = null;
	name: "bash" = "bash";
	apiType: "bash_20241022" = "bash_20241022";

	async run({
		command,
		restart,
	}: {
		command?: string;
		restart?: boolean;
	}): Promise<ToolResult> {
		if (restart) {
			if (this.session) {
				this.session.stop();
			}
			this.session = new BashSession();
			await this.session.start();
			return { system: "tool has been restarted." };
		}

		if (this.session === null) {
			this.session = new BashSession();
			await this.session.start();
		}

		if (command !== undefined) {
			return await this.session.run(command);
		}

		throw new ToolError("no command provided.");
	}

	toParams(): Anthropic.Beta.BetaToolBash20241022 {
		return {
			type: this.apiType,
			name: this.name,
		};
	}
}
*/
