import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig } from "vite";
import { pluginExposeRenderer } from "./vite.base.config";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path"; // Add this import

// https://vitejs.dev/config
export default defineConfig((env) => {
	const forgeEnv = env as ConfigEnv<"renderer">;
	const { root, mode, forgeConfigSelf } = forgeEnv;
	const name = forgeConfigSelf.name ?? "";

	return {
		root,
		mode,
		base: "./",
		build: {
			outDir: `.vite/renderer/${name}`,
		},
		plugins: [pluginExposeRenderer(name)],
		resolve: {
			preserveSymlinks: true,
		},
		css: {
			postcss: {
				plugins: [tailwindcss, autoprefixer],
			},
		},
		clearScreen: false,
	} as UserConfig;
});
