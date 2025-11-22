import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Typography } from '@/components/ui/typography';
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
import { ArrowUpDown, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

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
        cell: ({ row }) => <div>{row.getValue('basedOn')}</div>,
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

function DeviceTableWrapper({ keyword, selectedCategory, sorting, onSortingChange }: DeviceTableWrapperProps) {
    const { devices = [] } = usePage<{ devices?: Device[] }>().props;

    const filteredDevices = useMemo(() => {
        if (!devices || devices.length === 0) {
            return [];
        }
        return devices.filter((device) => {
            const matchesKeyword =
                keyword === '' ||
                device.name.toLowerCase().includes(keyword.toLowerCase()) ||
                device.basedOn.toLowerCase().includes(keyword.toLowerCase());

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
        <>
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
        </>
    );
}

export default function Welcome({ categories }: Props) {
    const [keyword, setKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sorting, setSorting] = useState<SortingState>([]);

    const handleReset = () => {
        setKeyword('');
        setSelectedCategory('all');
        setSorting([]);
    };

    return (
        <>
            <Head title="Search Quad Cortex Devices" />

            <div className="min-h-screen bg-background p-8 text-foreground lg:p-12">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Typography element="h1">Search devices</Typography>
                        <ThemeToggle />
                    </div>

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
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Search by name or based on..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            className="w-full"
                                        />
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
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                </div>
                            </div>
                            <DeviceTableWrapper
                                keyword={keyword}
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
