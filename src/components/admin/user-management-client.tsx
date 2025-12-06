
'use client';
import { useMemo, useTransition } from 'react';
import { Guest, Admin, Staff, UserRole, StaffType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateUserRoleAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Shield, User, Building, Loader2, Wrench } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '../ui/dropdown-menu';

function RoleManagementMenu({ user }: { user: DisplayUser }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleRoleChange = (targetRole: UserRole, staffType?: StaffType) => {
        startTransition(async () => {
            const result = await updateUserRoleAction(user.id, targetRole, staffType);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const isCurrentRole = (role: UserRole) => user.role === role;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    Manage Role
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange('guest')} disabled={isPending || isCurrentRole('guest')}>
                    <User className="mr-2 h-4 w-4" /> Make Guest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('admin')} disabled={isPending || isCurrentRole('admin')}>
                    <Building className="mr-2 h-4 w-4" /> Make Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Assign Staff Role</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                             {Object.values(StaffType).map(staffType => (
                                <DropdownMenuItem key={staffType} onClick={() => handleRoleChange('staff', staffType)} disabled={isPending || (isCurrentRole('staff') && user.staffType === staffType)}>
                                    <span>Make {staffType}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


type DisplayUser = (Guest | Admin | Staff) & { role: 'guest' | 'admin' | 'staff', staffType?: StaffType };

export function UserManagementClient({ initialGuests, initialAdmins, initialStaff, loading }: { initialGuests: Guest[], initialAdmins: Admin[], initialStaff: Staff[], loading: boolean }) {
    
    const allUsers: DisplayUser[] = useMemo(() => {
        const userMap = new Map<string, DisplayUser>();

        initialGuests.forEach(g => {
            userMap.set(g.id, { ...g, role: 'guest' });
        });

        initialStaff.forEach(s => {
            if (userMap.has(s.id)) {
                const existingUser = userMap.get(s.id);
                userMap.set(s.id, { ...existingUser!, ...s, role: 'staff' });
            } else {
                userMap.set(s.id, { ...s, role: 'staff' });
            }
        });

        initialAdmins.forEach(a => {
            if (userMap.has(a.id)) {
                const existingUser = userMap.get(a.id);
                userMap.set(a.id, { ...existingUser!, ...a, role: 'admin' });
            } else {
                userMap.set(a.id, { ...a, role: 'admin' });
            }
        });
        
        return Array.from(userMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [initialGuests, initialAdmins, initialStaff]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>A combined list of all guests, staff, and administrators in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !allUsers.length ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                            </TableRow>
                        ) : (
                           allUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{user.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'staff' ? 'secondary' : 'outline'}>
                                        {user.role === 'admin' ? <Building className="mr-2 h-3 w-3" /> : user.role === 'staff' ? <Wrench className="mr-2 h-3 w-3" /> : <User className="mr-2 h-3 w-3" />}
                                        {user.role === 'staff' ? `${user.staffType} (Staff)` : user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <RoleManagementMenu user={user} />
                                </TableCell>
                            </TableRow>
                           ))
                        )}
                         {!loading && allUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
    );
}
