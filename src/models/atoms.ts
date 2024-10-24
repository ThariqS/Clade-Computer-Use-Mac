import { atom, WritableAtom } from "jotai";
import {
	ActiveEdits,
	Brainstorms,
	CommitHistory,
	GitSuggestions,
	ProjectConfig,
	ProjectConsoleInterface,
	ProjectInfo,
	ProjectPreferences,
	ProjectSettings,
	ProjectTasks,
} from "src/models/project.models";

export enum ATOMID {
	PROJECT_INFO = "projectInfo",
	PROJECT_PREFERENCES = "projectPreferences",
	PROJECT_SETTINGS = "projectSettings",
	PROJECT_CONFIG = "projectConfig",
	PROJECT_TASKS = "projectTasks",
	GIT_CHANGES = "gitChanges",
	ACTIVE_EDITS = "activeEdits",
	PROJECT_CONSOLE = "projectConsole",
	BRAINSTORMS = "brainstorms",
	COMMIT_HISTORY = "commitHistory",
}

export type AtomTypeMap = {
	[ATOMID.PROJECT_CONFIG]: ProjectConfig;
	[ATOMID.GIT_CHANGES]: GitSuggestions;
	[ATOMID.PROJECT_TASKS]: ProjectTasks;
	[ATOMID.ACTIVE_EDITS]: ActiveEdits;
	[ATOMID.PROJECT_CONSOLE]: ProjectConsoleInterface;
	[ATOMID.BRAINSTORMS]: Brainstorms;
	[ATOMID.COMMIT_HISTORY]: CommitHistory;
	[ATOMID.PROJECT_INFO]: ProjectInfo;
	[ATOMID.PROJECT_PREFERENCES]: ProjectPreferences;
	[ATOMID.PROJECT_SETTINGS]: ProjectSettings;
	[ATOMID.ACTIVE_EDITS]: ActiveEdits;
};

function atomWithId<T>(id: ATOMID, initialValue?: T) {
	const atomWithId = atom(initialValue);
	(atomWithId as any).id = id;
	return atomWithId;
}

export const projectAtoms: Record<ATOMID, WritableAtom<any, any, any>> = {
	[ATOMID.PROJECT_INFO]: atomWithId<ProjectInfo>(ATOMID.PROJECT_INFO),
	[ATOMID.PROJECT_PREFERENCES]: atomWithId<ProjectPreferences>(
		ATOMID.PROJECT_PREFERENCES
	),
	[ATOMID.PROJECT_SETTINGS]: atomWithId<ProjectSettings>(
		ATOMID.PROJECT_SETTINGS
	),
	[ATOMID.PROJECT_CONFIG]: atomWithId<ProjectConfig>(ATOMID.PROJECT_CONFIG),
	[ATOMID.GIT_CHANGES]: atomWithId<GitSuggestions>(ATOMID.GIT_CHANGES),
	[ATOMID.PROJECT_TASKS]: atomWithId<ProjectTasks>(ATOMID.PROJECT_TASKS),
	[ATOMID.ACTIVE_EDITS]: atomWithId<ActiveEdits>(ATOMID.ACTIVE_EDITS),
	[ATOMID.PROJECT_CONSOLE]: atomWithId<ProjectConsoleInterface>(
		ATOMID.PROJECT_CONSOLE
	),
	[ATOMID.BRAINSTORMS]: atomWithId<Brainstorms>(ATOMID.BRAINSTORMS),
	[ATOMID.COMMIT_HISTORY]: atomWithId<CommitHistory>(ATOMID.COMMIT_HISTORY),
};
