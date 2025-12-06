
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useCollection, useDoc } from '@/firebase/hooks';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Assignment, Booking, ServiceRequest, Staff } from '@/lib/types';
import { GradientTitle } from '../ui/gradient-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { setStaffAvailability, updateServiceRequestStatus, updateAssignmentStatus } from '@/lib/data-client';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatRelative } from 'date-fns';
import { Badge } from '../ui/badge';


export function StaffDashboardClient({
    initialAssignments,
    initialServiceRequests,
    initialBookings,
    loading,
}: {
    initialAssignments: any[];
    initialServiceRequests: any[];
    initialBookings: any[];
    loading: boolean;
}) {
    const firestore = useFirestore();
    const user = useUser();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    // We need the user's own staff profile to get their availability status
    const staffProfileRef = useMemo(() => firestore && user ? doc(firestore, 'staff', user.uid) : null, [firestore, user]);
    const { data: staffProfile, loading: staffProfileLoading } = useDoc<Staff>(staffProfileRef);
    
    const isAvailable = staffProfile?.isAvailable ?? true;

    const activeAssignments = useMemo(() => {
        if (!initialAssignments || !initialServiceRequests || !initialBookings) return [];

        return initialAssignments
            .filter(a => a.status === 'Assigned')
            .map(assignment => {
                const request = initialServiceRequests.find(r => r.id === assignment.serviceRequestId);
                const booking = initialBookings.find(b => b.id === request?.bookingId);
                return {
                    ...assignment,
                    request: request,
                    booking: booking
                };
            })
            .filter(item => item.request && item.booking && item.staffId === user?.uid);
    }, [initialAssignments, initialServiceRequests, initialBookings, user?.uid]);
    
    const handleToggleAvailability = async () => {
        if (!user) return;
        setIsUpdating(true);
        try {
            await setStaffAvailability(user.uid, !isAvailable);
            toast({ title: `You are now ${!isAvailable ? 'available' : 'unavailable'}` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleMarkComplete = async (assignment: any) => {
        if (!user || !assignment.request?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot complete task due to missing information.' });
            return;
        }

        setIsUpdating(true);
        try {
            // Update all related documents
            await updateServiceRequestStatus(assignment.request.id, 'Completed');
            await updateAssignmentStatus(assignment.id, 'Completed');
            await setStaffAvailability(user.uid, true); // Become available again

            toast({ title: 'Task Completed!', description: 'You have been marked as available for new assignments.' });
        } catch (error) {
             const message = error instanceof Error ? error.message : 'Could not mark task as complete.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading || staffProfileLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <GradientTitle>My Dashboard</GradientTitle>
                <div className="flex items-center gap-2">
                    <Badge variant={isAvailable ? 'secondary' : 'outline'} className={isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : ''}>
                        Status: {isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                     <Button variant="outline" size="sm" onClick={handleToggleAvailability} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAvailable ? 'Go Unavailable' : 'Become Available'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Active Assignments</CardTitle>
                    <CardDescription>These are the tasks currently assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Assigned</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {activeAssignments.length > 0 ? activeAssignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell>
                                        <div className="font-medium">{assignment.request.type}</div>
                                        <div className="text-sm text-muted-foreground">{assignment.request.description}</div>
                                    </TableCell>
                                     <TableCell>
                                        <div className="font-medium">Room {assignment.booking?.roomId || 'N/A'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {assignment.assignedAt ? formatRelative(assignment.assignedAt, new Date()) : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <Button size="sm" onClick={() => handleMarkComplete(assignment)} disabled={isUpdating}>
                                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                            Mark Complete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        You have no active assignments.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
