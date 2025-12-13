import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/Footer";
import { ShortcutBadge } from "@/components/ShortcutBadge";
import { SortableColumnHeader } from "@/components/SortableColumnHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { useDebounce } from "@/hooks/useDebounce";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import type { Device } from "@/types";

interface DevicesResponse {
	devices: Device[];
	categories: string[];
}

export type SortDirection = "asc" | "desc" | null;
export type SortKey = keyof Device;

interface SortState {
	key: SortKey | null;
	direction: SortDirection;
}

interface DeviceTableWrapperProps {
	devices: Device[];
	keyword: string;
	selectedCategory: string;
	sorting: SortState;
	onSortingChange: (sorting: SortState) => void;
}

function getCategoryDisplay(device: Device): string {
	const { category, deviceCategory } = device;

	if (category === "Neural Captures V2" && deviceCategory) {
		return `${deviceCategory} (Capture V2)`;
	}

	if (category === "Plugin devices" && deviceCategory) {
		return `${deviceCategory} (Plugin)`;
	}

	return category;
}

function getSortValue(device: Device, key: SortKey): string {
	if (key === "category") {
		return device.deviceCategory || device.category;
	}
	return device[key] ?? "";
}

function getFilteredAndSortedDevices(
	devices: Device[],
	keyword: string,
	selectedCategory: string,
	sorting: SortState,
): Device[] {
	if (!devices || devices.length === 0) {
		return [];
	}

	const lowerKeyword = keyword.toLowerCase();
	let filtered = devices.filter((device) => {
		const matchesKeyword =
			keyword === "" ||
			device.name.toLowerCase().includes(lowerKeyword) ||
			device.basedOn.toLowerCase().includes(lowerKeyword) ||
			(device.deviceCategory?.toLowerCase().includes(lowerKeyword) ?? false) ||
			(device.previousName?.toLowerCase().includes(lowerKeyword) ?? false);

		const matchesCategory =
			selectedCategory === "all" || device.category === selectedCategory;

		return matchesKeyword && matchesCategory;
	});

	if (sorting.key && sorting.direction) {
		const { key, direction } = sorting;
		filtered = [...filtered].sort((a, b) => {
			const aVal = getSortValue(a, key);
			const bVal = getSortValue(b, key);
			const cmp = aVal.localeCompare(bVal);
			return direction === "asc" ? cmp : -cmp;
		});
	}

	return filtered;
}

function DeviceTableWrapper({
	devices,
	keyword,
	selectedCategory,
	sorting,
	onSortingChange,
}: DeviceTableWrapperProps) {
	const toggleSort = (key: SortKey) => {
		onSortingChange(
			sorting.key === key
				? {
						key,
						direction:
							sorting.direction === "asc"
								? "desc"
								: sorting.direction === "desc"
									? null
									: "asc",
					}
				: { key, direction: "asc" },
		);
	};

	const filteredAndSortedDevices = getFilteredAndSortedDevices(
		devices,
		keyword,
		selectedCategory,
		sorting,
	);

	return (
		<TooltipProvider>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<SortableColumnHeader
								title="Category"
								sortKey="category"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
						<TableHead>
							<SortableColumnHeader
								title="Name"
								sortKey="name"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
						<TableHead>
							<SortableColumnHeader
								title="Based On"
								sortKey="basedOn"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
						<TableHead>
							<SortableColumnHeader
								title="Added in CorOS"
								sortKey="addedInCorOS"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
						<TableHead>
							<SortableColumnHeader
								title="Previous Name"
								sortKey="previousName"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
						<TableHead>
							<SortableColumnHeader
								title="Updated in CorOS"
								sortKey="updatedInCorOS"
								currentSort={sorting}
								onSort={toggleSort}
							/>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredAndSortedDevices.length > 0 ? (
						filteredAndSortedDevices.map((device, index) => (
							<TableRow key={`${device.category}-${device.name}-${index}`}>
								<TableCell>
									<div className="whitespace-nowrap">
										{getCategoryDisplay(device)}
									</div>
								</TableCell>
								<TableCell>
									<div className="font-medium whitespace-nowrap">
										{device.name}
									</div>
								</TableCell>
								<TableCell>
									<BasedOnCell basedOn={device.basedOn} />
								</TableCell>
								<TableCell>
									<div className="whitespace-nowrap">{device.addedInCorOS}</div>
								</TableCell>
								<TableCell>
									<div className="whitespace-nowrap text-muted-foreground">
										{device.previousName || "-"}
									</div>
								</TableCell>
								<TableCell>
									<div className="whitespace-nowrap text-muted-foreground">
										{device.updatedInCorOS || "-"}
									</div>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={6}
								className="h-32 text-center text-muted-foreground"
							>
								No devices found matching your filters.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<div className="border-t border-border/30 px-3 py-2 text-xs text-muted-foreground sm:px-4 sm:py-3">
				Showing {filteredAndSortedDevices.length} of {devices.length} devices
			</div>
		</TooltipProvider>
	);
}

function BasedOnCell({ basedOn }: { basedOn: string }) {
	const handleGoogleSearch = () => {
		window.open(
			`https://www.google.com/search?q=${encodeURIComponent(basedOn)}`,
			"_blank",
		);
	};

	const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(basedOn)}`;
	const duckduckgoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(basedOn)}`;

	return (
		<div className="flex items-center gap-1.5 sm:gap-2">
			<span className="whitespace-nowrap">{basedOn}</span>
			{basedOn && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleGoogleSearch}
							className="h-6 w-6 shrink-0"
						>
							<ExternalLink className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<div className="flex flex-col gap-1">
							<a
								href={googleUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
								onClick={(e) => e.stopPropagation()}
							>
								Search on Google
							</a>
							<a
								href={duckduckgoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
								onClick={(e) => e.stopPropagation()}
							>
								Search on DuckDuckGo
							</a>
						</div>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}

export default function App() {
	const [data, setData] = useState<DevicesResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		fetch("/api/devices")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Failed to fetch devices");
				}
				return response.json();
			})
			.then(setData)
			.catch(setError)
			.finally(() => setIsLoading(false));
	}, []);

	const [keyword, setKeyword] = useState("");
	const debouncedKeyword = useDebounce(keyword, 200);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [sorting, setSorting] = useState<SortState>({
		key: null,
		direction: null,
	});
	const searchInputRef = useRef<HTMLInputElement>(null);

	const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setKeyword(e.target.value);
	};

	useKeyboardShortcut({
		key: "k",
		metaKey: true,
		callback: () => {
			searchInputRef.current?.focus();
			searchInputRef.current?.select();
		},
		ignoreWhenFocused: searchInputRef,
	});

	useKeyboardShortcut({
		key: "Escape",
		callback: () => {
			if (document.activeElement === searchInputRef.current) {
				searchInputRef.current?.blur();
			}
		},
	});

	const handleReset = () => {
		setKeyword("");
		setSelectedCategory("all");
		setSorting({ key: null, direction: null });
	};

	useKeyboardShortcut({
		key: "Backspace",
		metaKey: true,
		callback: handleReset,
		ignoreWhenFocused: searchInputRef,
	});

	useKeyboardShortcut({
		key: "Delete",
		metaKey: true,
		callback: handleReset,
		ignoreWhenFocused: searchInputRef,
	});

	const devices = data?.devices ?? [];
	const categories = data?.categories ?? [];

	return (
		<>
			<div className="border-b border-border/40 bg-background">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-1 sm:py-0.5">
					<Typography element="h4" className="text-xs font-normal">
						Search devices
					</Typography>
					<ThemeToggle />
				</div>
			</div>

			<div className="min-h-screen bg-background p-0 text-foreground sm:p-6 lg:p-12">
				<div className="mx-auto max-w-7xl">
					{isLoading ? (
						<div className="rounded-lg border border-border/40 bg-card p-8 text-center shadow-sm sm:p-12">
							<div className="space-y-4">
								<div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
								<Typography className="text-muted-foreground">
									Loading devices...
								</Typography>
							</div>
						</div>
					) : error ? (
						<div className="rounded-lg border border-border/40 bg-card p-8 text-center shadow-sm sm:p-12">
							<Typography className="text-destructive">
								Failed to load devices. Please try again.
							</Typography>
						</div>
					) : (
						<div className="rounded-none border-x-0 border-t-0 border-b border-border/40 bg-card shadow-none sm:rounded-lg sm:border sm:shadow-sm">
							<div className="border-b border-border/30 p-3 sm:p-4">
								<div className="flex flex-col gap-3 sm:flex-row">
									<div className="relative flex-1">
										<Input
											ref={searchInputRef}
											type="text"
											placeholder="Search by name, based on, device category, or previous name..."
											value={keyword}
											onChange={handleKeywordChange}
											className="w-full pr-12 sm:pr-16"
										/>
										<div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
											<ShortcutBadge
												keys={["meta", "k"]}
												className="hidden sm:inline-flex"
											/>
										</div>
									</div>
									<div className="w-full sm:w-56">
										<Select
											value={selectedCategory}
											onValueChange={setSelectedCategory}
										>
											<SelectTrigger>
												<SelectValue placeholder="Filter by category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Categories</SelectItem>
												{categories.map((category) => (
													<SelectItem key={category} value={category}>
														{category}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<Button
										variant="outline"
										onClick={handleReset}
										className="w-full sm:w-auto"
									>
										Reset
										<ShortcutBadge
											keys={["meta", "delete"]}
											className="ml-2 hidden sm:inline-flex"
										/>
									</Button>
								</div>
							</div>
							<DeviceTableWrapper
								devices={devices}
								keyword={debouncedKeyword}
								selectedCategory={selectedCategory}
								sorting={sorting}
								onSortingChange={setSorting}
							/>
						</div>
					)}

					<Footer />
				</div>
			</div>
		</>
	);
}
