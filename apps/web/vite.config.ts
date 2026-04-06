import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const port = Number(env.PORT);

	return {
		plugins: [tailwindcss(), tsconfigPaths()],
		resolve: {
			dedupe: ["react", "react-dom"],
		},
		server: {
			port: Number(port),
			strictPort: true,
		},
	};
});
