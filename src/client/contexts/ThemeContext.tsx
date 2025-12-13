import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") {
		return "light";
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function getStoredTheme(): Theme {
	if (typeof window === "undefined") {
		return "system";
	}
	const stored = localStorage.getItem("theme");
	if (stored === "light" || stored === "dark" || stored === "system") {
		return stored;
	}
	return "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
	if (theme === "system") {
		return getSystemTheme();
	}
	return theme;
}

function applyThemeToDocument(resolvedTheme: "light" | "dark"): void {
	const root = document.documentElement;
	if (resolvedTheme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
}

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
		resolveTheme(getStoredTheme()),
	);

	useEffect(() => {
		const resolved = resolveTheme(theme);
		applyThemeToDocument(resolved);
		setResolvedTheme(resolved);
	}, [theme]);

	useEffect(() => {
		if (theme !== "system") {
			return;
		}

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			const resolved = getSystemTheme();
			applyThemeToDocument(resolved);
			setResolvedTheme(resolved);
		};

		mediaQuery.addEventListener("change", handleChange);

		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, [theme]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem("theme", newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
