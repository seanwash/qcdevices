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
import { ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    categories: string[];
    devices?: Device[];
}

interface DeviceTableWrapperProps {
    keyword: string;
    selectedCategory: string;
}

const columns: ColumnDef<Device>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Name
                    <ArrowUpDown />
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
                    Based On
                    <ArrowUpDown />
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
                    Category
                    <ArrowUpDown />
                </Button>
            );
        },
        cell: ({ row }) => <div>{row.getValue('category')}</div>,
    },
];

function DeviceTableWrapper({ keyword, selectedCategory }: DeviceTableWrapperProps) {
    const { devices = [] } = usePage<{ devices?: Device[] }>().props;
    const [sorting, setSorting] = useState<SortingState>([]);

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
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-lg border bg-card">
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
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                No devices found matching your filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="border-t p-4 text-sm text-muted-foreground">
                Showing {filteredDevices.length} of {devices.length} devices
            </div>
        </div>
    );
}

export default function Welcome({ categories }: Props) {
    const [keyword, setKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    return (
        <>
            <Head title="QC Devices" />

            <div className="min-h-screen bg-background p-6 text-foreground lg:p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <Typography element="h1">QC Devices</Typography>
                            <Typography modifier="muted">Search Neural DSP Quad Cortex devices</Typography>
                        </div>
                        <ThemeToggle />
                    </div>

                    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by name or based on..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="w-full sm:w-64">
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
                    </div>

                    <Deferred
                        data="devices"
                        fallback={
                            <div className="rounded-lg border bg-card p-8 text-center">
                                <div className="space-y-4">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    <Typography modifier="muted">Loading devices...</Typography>
                                </div>
                            </div>
                        }
                    >
                        <DeviceTableWrapper keyword={keyword} selectedCategory={selectedCategory} />
                    </Deferred>

                    <Footer />
                </div>
            </div>
        </>
    );
}
