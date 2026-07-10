import { defineConfig } from "@playwright/test";

const PORT = 3457;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	use: {
		baseURL: `http://localhost:${PORT}`,
	},
	webServer: {
		command: "pnpm vite --port 3457 --strictPort",
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		env: {
			VITE_SERVER_URL: "http://localhost:9999",
		},
	},
});
