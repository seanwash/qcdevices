import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative h-7 w-7 hover:bg-transparent hover:text-muted-foreground/80"
				>
					<Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) =>
						setTheme(value as "light" | "dark" | "system")
					}
				>
					<DropdownMenuRadioItem value="light">
						<Sun className="mr-2 h-4 w-4" />
						<span>Light</span>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">
						<Moon className="mr-2 h-4 w-4" />
						<span>Dark</span>
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">
						<Monitor className="mr-2 h-4 w-4" />
						<span>System</span>
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
