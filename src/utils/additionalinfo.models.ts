export interface ActiveWindowInfo {
	activeApplication: string;
	chrome?: {
		activeURL: string;
		allURLs: ChromeTab[];
	};
	openApplications: string[];
}

export interface ChromeTab {
	url: string;
	title: string;
}
