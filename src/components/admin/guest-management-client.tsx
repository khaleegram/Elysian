
'use client';
import { useMemo } from 'react';
import { Guest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export function GuestManagementClient({ initialGuests }: { initialGuests: Guest[] }) {
    
    const sortedGuests = useMemo(() => {
        return [...(initialGuests || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [initialGuests]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Guests</CardTitle>
                <CardDescription>A list of all guests who have interacted with the hotel.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Guest</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Booking History</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!initialGuests ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading guests...</TableCell>
                            </TableRow>
                        ) : (
                           sortedGuests.map(guest => (
                            <TableRow key={guest.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{guest.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{guest.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{guest.email}</TableCell>
                                <TableCell>{guest.phone || 'N/A'}</TableCell>
                                <TableCell>{guest.bookingHistory?.length || 0} stays</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/admin/guests/${guest.id}`}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View Guest Profile</span>
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                           ))
                        )}
                         {initialGuests?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No guests found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    );
}
