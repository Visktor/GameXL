import { createRequire } from "node:module";
import { dirname } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
const resolvePackageDir = (name: string) =>
	dirname(require.resolve(`${name}/package.json`));

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		dedupe: ["react", "react-dom"],
		alias: {
			react: resolvePackageDir("react"),
			"react-dom": resolvePackageDir("react-dom"),
		},
	},
	test: {
		name: "web",
		environment: "happy-dom",
		setupFiles: ["./vitest.setup.ts"],
		env: {
			VITE_SERVER_URL: "http://localhost:3000",
		},
		server: {
			deps: {
				inline: true,
			},
		},
		exclude: ["dist/**", "node_modules/**", "e2e/**"],
	},
});
