import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection, SortKey } from "@/App";
import { Button } from "@/components/ui/button";

interface SortState {
	key: SortKey | null;
	direction: SortDirection;
}

interface SortableColumnHeaderProps {
	title: string;
	sortKey: SortKey;
	currentSort: SortState;
	onSort: (key: SortKey) => void;
}

export function SortableColumnHeader({
	title,
	sortKey,
	currentSort,
	onSort,
}: SortableColumnHeaderProps) {
	const isActive = currentSort.key === sortKey;
	const direction = isActive ? currentSort.direction : null;

	return (
		<Button variant="naked" onClick={() => onSort(sortKey)} className="gap-1">
			{title}
			{direction === "asc" ? (
				<ArrowUp className="h-3 w-3 opacity-60" />
			) : direction === "desc" ? (
				<ArrowDown className="h-3 w-3 opacity-60" />
			) : (
				<ArrowUpDown className="h-3 w-3 opacity-30" />
			)}
		</Button>
	);
}
