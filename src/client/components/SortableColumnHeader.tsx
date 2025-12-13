import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableColumnHeaderProps<T> {
	column: Column<T>;
	title: string;
}

export function SortableColumnHeader<T>({
	column,
	title,
}: SortableColumnHeaderProps<T>) {
	const sorted = column.getIsSorted();
	return (
		<Button
			variant="naked"
			onClick={() => column.toggleSorting(sorted === "asc")}
			className="gap-1"
		>
			{title}
			{sorted === "asc" ? (
				<ArrowUp className="h-3 w-3 opacity-60" />
			) : sorted === "desc" ? (
				<ArrowDown className="h-3 w-3 opacity-60" />
			) : (
				<ArrowUpDown className="h-3 w-3 opacity-30" />
			)}
		</Button>
	);
}
