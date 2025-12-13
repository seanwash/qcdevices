import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	root: "src/client",
	publicDir: "../../public",
	build: {
		outDir: "../../dist/client",
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": `${import.meta.dirname}/src/client`,
		},
	},
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
		},
	},
});
