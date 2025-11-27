import { Footer } from '@/components/Footer';
import { ShortcutBadge } from '@/components/ShortcutBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import type { Device } from '@/types';
import { Deferred, Head, usePage } from '@inertiajs/react';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

interface Props {
    categories: string[];
    devices?: Device[];
}

interface DeviceTableWrapperProps {
    keyword: string;
    selectedCategory: string;
    sorting: SortingState;
    onSortingChange: (sorting: SortingState) => void;
}

const columns: ColumnDef<Device>[] = [
    {
        accessorKey: 'category',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Category
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        accessorFn: (row) => {
            // For sorting, use deviceCategory if available, otherwise use category
            return row.deviceCategory || row.category;
        },
        cell: ({ row }) => {
            const category = row.original.category;
            const deviceCategory = row.original.deviceCategory;
            const pluginSource = row.original.pluginSource;

            if (category === 'Neural Captures V2' && deviceCategory) {
                return <div className="whitespace-nowrap">{deviceCategory} (Capture V2)</div>;
            }

            if (category === 'Plugin devices' && deviceCategory) {
                return <div className="whitespace-nowrap">{deviceCategory} (Plugin)</div>;
            }

            return <div className="whitespace-nowrap">{category}</div>;
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Name
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'basedOn',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Based On
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => {
            const basedOnValue = row.getValue('basedOn') as string;
            const handleGoogleSearch = () => {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(basedOnValue)}`;
                window.open(searchUrl, '_blank');
            };

            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(basedOnValue)}`;
            const duckduckgoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(basedOnValue)}`;

            return (
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="whitespace-nowrap">{basedOnValue}</span>
                    {basedOnValue && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleGoogleSearch} className="h-6 w-6 shrink-0">
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        Search on Google
                                    </a>
                                    <a
                                        href={duckduckgoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        Search on DuckDuckGo
                                    </a>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'addedInCorOS',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Added in CorOS
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue('addedInCorOS')}</div>,
    },
    {
        accessorKey: 'previousName',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Previous Name
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => {
            const previousName = row.getValue('previousName') as string | undefined;
            return <div className="whitespace-nowrap text-muted-foreground">{previousName || '-'}</div>;
        },
    },
    {
        accessorKey: 'updatedInCorOS',
        header: ({ column }) => {
            const sorted = column.getIsSorted();
            return (
                <Button variant="naked" onClick={() => column.toggleSorting(sorted === 'asc')} className="gap-1">
                    Updated in CorOS
                    {sorted === 'asc' ? (
                        <ArrowUp className="h-3 w-3 opacity-60" />
                    ) : sorted === 'desc' ? (
                        <ArrowDown className="h-3 w-3 opacity-60" />
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                </Button>
            );
        },
        cell: ({ row }) => {
            const updatedInCorOS = row.getValue('updatedInCorOS') as string | undefined;
            return <div className="whitespace-nowrap text-muted-foreground">{updatedInCorOS || '-'}</div>;
        },
    },
];

const DeviceTableWrapper = memo(function DeviceTableWrapper({ keyword, selectedCategory, sorting, onSortingChange }: DeviceTableWrapperProps) {
    const { devices = [] } = usePage<{ devices?: Device[] }>().props;

    const filteredDevices = useMemo(() => {
        if (!devices || devices.length === 0) {
            return [];
        }

        const lowerKeyword = keyword.toLowerCase();
        return devices.filter((device) => {
            const matchesKeyword =
                keyword === '' ||
                device.name.toLowerCase().includes(lowerKeyword) ||
                device.basedOn.toLowerCase().includes(lowerKeyword) ||
                (device.deviceCategory?.toLowerCase().includes(lowerKeyword) ?? false) ||
                (device.previousName?.toLowerCase().includes(lowerKeyword) ?? false);

            const matchesCategory = selectedCategory === 'all' || device.category === selectedCategory;

            return matchesKeyword && matchesCategory;
        });
    }, [devices, keyword, selectedCategory]);

    const table = useReactTable({
        data: filteredDevices,
        columns,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            onSortingChange(newSorting);
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <TooltipProvider>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const meta = header.column.columnDef.meta;
                                return (
                                    <TableHead key={header.id} className={meta?.className}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                {row.getVisibleCells().map((cell) => {
                                    const meta = cell.column.columnDef.meta;
                                    return (
                                        <TableCell key={cell.id} className={meta?.className}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                No devices found matching your filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="border-t border-border/30 px-3 py-2 text-xs text-muted-foreground sm:px-4 sm:py-3">
                Showing {filteredDevices.length} of {devices.length} devices
            </div>
        </TooltipProvider>
    );
});

export default function Welcome({ categories }: Props) {
    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebounce(keyword, 200);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sorting, setSorting] = useState<SortingState>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
    }, []);

    useKeyboardShortcut({
        key: 'k',
        metaKey: true,
        callback: () => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        },
        ignoreWhenFocused: searchInputRef,
    });

    useKeyboardShortcut({
        key: 'Escape',
        callback: () => {
            if (document.activeElement === searchInputRef.current) {
                searchInputRef.current?.blur();
            }
        },
    });

    const handleReset = () => {
        setKeyword('');
        setSelectedCategory('all');
        setSorting([]);
    };

    useKeyboardShortcut({
        key: 'Backspace',
        metaKey: true,
        callback: handleReset,
        ignoreWhenFocused: searchInputRef,
    });

    useKeyboardShortcut({
        key: 'Delete',
        metaKey: true,
        callback: handleReset,
        ignoreWhenFocused: searchInputRef,
    });

    return (
        <>
            <Head title="Search Quad Cortex Devices" />

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
                    <Deferred
                        data="devices"
                        fallback={
                            <div className="rounded-lg border border-border/40 bg-card p-8 text-center shadow-sm sm:p-12">
                                <div className="space-y-4">
                                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                    <Typography modifier="muted">Loading devices...</Typography>
                                </div>
                            </div>
                        }
                    >
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
                                            <ShortcutBadge keys={['meta', 'k']} className="hidden sm:inline-flex" />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-56">
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                                    <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                                        Reset
                                        <ShortcutBadge keys={['meta', 'delete']} className="ml-2 hidden sm:inline-flex" />
                                    </Button>
                                </div>
                            </div>
                            <DeviceTableWrapper
                                keyword={debouncedKeyword}
                                selectedCategory={selectedCategory}
                                sorting={sorting}
                                onSortingChange={setSorting}
                            />
                        </div>
                    </Deferred>

                    <Footer />
                </div>
            </div>
        </>
    );
}
