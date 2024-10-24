import { Edits } from "src/mandark/types";

export interface FolderConfig {
	folderPath: string;
	description: string;
	status: "include" | "exclude";
}

export type ProjectInfo = ProjectInfoComplete | ProjectInfoError;

export interface ProjectInfoComplete {
	status: "complete";
	name: string;
	language: string;
	frameworks: string[];
	buildTools: string[];
	description?: string;
	tokenCount: number;
}

export interface ProjectInfoError {
	status: "error";
	tokenCount: number;
}

export interface ProjectPreferences {
	architecture?: string[];
	codeStyle?: string[];
}

export interface ProjectConsoleInterface {
	commands: {
		name: string;
		command: string;
	}[];
	consoleOutput: string[];
}

export interface Task {
	type: string;
	description: string;
	project_descriptions: string[];
}

export interface Brainstorm {
	tasks: Task[];
}

export interface BrainstormTopic {
	name: string;
	description: string;
}

export interface Brainstorms {
	topics: BrainstormTopic[];
	brainstorms: Brainstorm[];
}

export interface ActiveEdits {
	activeEdits: ActiveEdit[];
}

export interface ActiveEdit {
	id: string;
	name: string;
	loading: boolean;
	edits: Edits;
	status: "applied" | "pending" | "loading" | "error" | "verifying";
	hash?: string;
	files: Record<string, string[]>;
}

export interface AIGitCommit {
	hash: string;
	source: string;
	creator: string;
}

export interface GitCommit {
	hash: string;
	message: string;
	date: string;
	files: string[];
}

export interface CommitHistory {
	commits: GitCommit[];
}

export interface FileChange {
	path: string;
	type: "added" | "modified" | "deleted";
}

export interface UnstagedChange {
	commit_title: string;
	files: FileChange[];
	last_updated: string;
	last_hash: string;
}

export interface GitSuggestions {
	possible_commits: UnstagedChange[];
}

export interface ProjectSuggestions {
	changes_description: {
		description: string;
		files: string[];
		last_updated: string;
		last_hash: string;
		project_name?: string;
		suggestions: {
			reasoning: string;
			description: string;
			technical_details: string;
			suggestion_type:
				| "refactor"
				| "feature"
				| "idea"
				| "bug_fix"
				| "new_package"
				| "other";
		}[];
	}[];
}

export interface ProjectTasks {
	tasks: {
		name: string;
		description: string;
		possible_next_steps: string[]; //1-2 next steps, focus on core changes in the codebase
	}[];
}

export interface ProjectSettings {
	knowledgeOfCodebase: "high" | "medium" | "low";
	knowledgeOfLanguage: "high" | "medium" | "low";
	knowledgeOfFrameworks: "high" | "medium" | "low";
}

export interface ProjectConfig {
	folderPath: string;
	foldersConfig?: FolderConfig[];
}
