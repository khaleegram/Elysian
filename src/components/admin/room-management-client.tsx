
'use client';
import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Room, RoomStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { deleteRoomAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { BedDouble, Check, Wrench, Sparkles, PlusCircle, Trash, Edit, MoreHorizontal, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AddRoomDialog } from './add-room-dialog';

export const statusStyles: Record<RoomStatus, { icon: React.ElementType, variant: 'default' | 'secondary' | 'outline' | 'destructive', className: string }> = {
  Available: { icon: Check, variant: 'secondary', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  Occupied: { icon: BedDouble, variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  Dirty: { icon: Sparkles, variant: 'outline', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  Maintenance: { icon: Wrench, variant: 'destructive', className: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};


export function RoomManagementClient({ initialRooms }: { initialRooms: Room[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const sortedRooms = useMemo(() => {
        return [...(initialRooms || [])].sort((a, b) => (a.number || '').localeCompare(b.number || ''));
    }, [initialRooms]);

    const handleEditClick = (room: Room) => {
        setSelectedRoom(room);
        setIsAddDialogOpen(true);
    };

    const handleDeleteClick = (room: Room) => {
        setSelectedRoom(room);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRoom) return;
        startTransition(async () => {
            const result = await deleteRoomAction(selectedRoom.id);
             if (result.success) {
                toast({ title: 'Success!', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            setIsDeleteDialogOpen(false);
            setSelectedRoom(null);
        });
    };

    return (
        <>
            <AddRoomDialog 
                isOpen={isAddDialogOpen} 
                onOpenChange={(open) => {
                    if (!open) setSelectedRoom(null);
                    setIsAddDialogOpen(open);
                }}
                room={selectedRoom || undefined}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete room {selectedRoom?.number} and its data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Room Inventory</CardTitle>
                        <CardDescription>A real-time overview of all rooms in the hotel.</CardDescription>
                    </div>
                    <div>
                        <Button onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Room
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room No.</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!initialRooms ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">Loading rooms...</TableCell>
                                </TableRow>
                            ) : (
                               sortedRooms.map(room => {
                                const StatusIcon = statusStyles[room.status].icon;
                                return (
                                <TableRow key={room.id} className={isPending && selectedRoom?.id === room.id ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium">{room.number}</TableCell>
                                    <TableCell>{room.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusStyles[room.status].variant} className={statusStyles[room.status].className}>
                                            <StatusIcon className="mr-2 h-4 w-4" />
                                            {room.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>${room.price.toFixed(2)} / night</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/rooms/${room.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditClick(room)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Room
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteClick(room)} className="text-destructive">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete Room
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                               )})
                            )}
                             {initialRooms?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No rooms found. Click "Add Room" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </>
    );
}
