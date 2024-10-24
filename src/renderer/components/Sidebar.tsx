import React from "react";

interface SidebarProps {
	apiKey: string;
	setApiKey: (key: string) => void;
	provider: string;
	setProvider: (provider: string) => void;
	model: string;
	setModel: (model: string) => void;
	customSystemPrompt: string;
	setCustomSystemPrompt: (prompt: string) => void;
	hideImages: boolean;
	setHideImages: (hide: boolean) => void;
	onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	apiKey,
	setApiKey,
	provider,
	setProvider,
	model,
	setModel,
	customSystemPrompt,
	setCustomSystemPrompt,
	hideImages,
	setHideImages,
	onReset,
}) => {
	return (
		<aside className="w-64 bg-gray-200 p-4">
			<h2 className="text-xl font-bold mb-4">Settings</h2>
			<div className="mb-4">
				<label className="block mb-2">API Provider</label>
				<select
					value={provider}
					onChange={(e) => setProvider(e.target.value)}
					className="w-full p-2 border rounded"
				>
					<option value="anthropic">Anthropic</option>
					<option value="bedrock">Bedrock</option>
					<option value="vertex">Vertex</option>
				</select>
			</div>
			<div className="mb-4">
				<label className="block mb-2">Model</label>
				<input
					type="text"
					value={model}
					onChange={(e) => setModel(e.target.value)}
					className="w-full p-2 border rounded"
				/>
			</div>
			<div className="mb-4">
				<label className="block mb-2">API Key</label>
				<input
					type="password"
					value={apiKey}
					onChange={(e) => setApiKey(e.target.value)}
					className="w-full p-2 border rounded"
				/>
			</div>
			<div className="mb-4">
				<label className="block mb-2">Custom System Prompt</label>
				<textarea
					value={customSystemPrompt}
					onChange={(e) => setCustomSystemPrompt(e.target.value)}
					className="w-full p-2 border rounded"
					rows={4}
				/>
			</div>
			<div className="mb-4">
				<label className="flex items-center">
					<input
						type="checkbox"
						checked={hideImages}
						onChange={(e) => setHideImages(e.target.checked)}
						className="mr-2"
					/>
					Hide Images
				</label>
			</div>
			<button
				onClick={onReset}
				className="w-full bg-red-500 text-white p-2 rounded"
			>
				Reset
			</button>
		</aside>
	);
};

export default Sidebar;
