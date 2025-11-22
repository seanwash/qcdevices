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
import { ArrowUpDown, ExternalLink } from 'lucide-react';
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
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Name
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'basedOn',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Based On
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
                <div className="flex items-center gap-2">
                    <span>{basedOnValue}</span>
                    {basedOnValue && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleGoogleSearch} className="h-6 w-6">
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
        accessorKey: 'category',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Category
                </Button>
            );
        },
        cell: ({ row }) => <div>{row.getValue('category')}</div>,
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
                keyword === '' || device.name.toLowerCase().includes(lowerKeyword) || device.basedOn.toLowerCase().includes(lowerKeyword);

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
                                return (
                                    <TableHead key={header.id}>
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
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
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
            <div className="border-t border-border/30 px-4 py-3 text-xs text-muted-foreground">
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
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-0.5">
                    <Typography element="h4" className="text-xs font-normal">
                        Search devices
                    </Typography>
                    <ThemeToggle />
                </div>
            </div>

            <div className="min-h-screen bg-background p-8 text-foreground lg:p-12">
                <div className="mx-auto max-w-7xl">
                    <Deferred
                        data="devices"
                        fallback={
                            <div className="rounded-lg border border-border/40 bg-card p-12 text-center shadow-sm">
                                <div className="space-y-4">
                                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                                    <Typography modifier="muted">Loading devices...</Typography>
                                </div>
                            </div>
                        }
                    >
                        <div className="rounded-lg border border-border/40 bg-card shadow-sm">
                            <div className="border-b border-border/30 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative flex-1">
                                        <Input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search by name or based on..."
                                            value={keyword}
                                            onChange={handleKeywordChange}
                                            className="w-full pr-16"
                                        />
                                        <div className="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
                                            <ShortcutBadge keys={['meta', 'k']} />
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
                                        <ShortcutBadge keys={['meta', 'delete']} className="ml-2" />
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
