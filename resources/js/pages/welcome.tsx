import { Footer } from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Typography } from '@/components/ui/typography';
import type { Device } from '@/types';
import { Deferred, Head, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Props {
    categories: string[];
    devices?: Device[];
}

interface DeviceTableWrapperProps {
    keyword: string;
    selectedCategory: string;
}

function DeviceTableWrapper({ keyword, selectedCategory }: DeviceTableWrapperProps) {
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

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Based On</TableHead>
                        <TableHead>Category</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredDevices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No devices found matching your filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredDevices.map((device, index) => (
                            <TableRow key={`${device.name}-${index}`}>
                                <TableCell className="font-medium">{device.name}</TableCell>
                                <TableCell>{device.basedOn}</TableCell>
                                <TableCell>{device.category}</TableCell>
                            </TableRow>
                        ))
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
                    <div className="mb-8">
                        <Typography element="h1">QC Devices</Typography>
                        <Typography modifier="muted">Search Neural DSP Quad Cortex devices</Typography>
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
