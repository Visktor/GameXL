import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		name: "api",
		environment: "node",
		setupFiles: ["../../vitest.setup.ts"],
		exclude: ["dist/**", "node_modules/**"],
	},
});
