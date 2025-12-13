import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import App from "./App";
import "./styles/app.css";

// biome-ignore lint/style/noNonNullAssertion: root element guaranteed to exist
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider>
			<App />
		</ThemeProvider>
	</StrictMode>,
);
