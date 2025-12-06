'use client';

import { UserManagementClient } from '@/components/admin/user-management-client';
import { useGuests } from '@/hooks/use-guests';
import { useAdmins } from '@/hooks/use-admins';
import { useStaff } from '@/hooks/use-staff';
import { GradientTitle } from '@/components/ui/gradient-title';
import { UserCog } from 'lucide-react';

export default function UserManagementPage() {
    
    const { guests, loading: guestsLoading } = useGuests();
    const { admins, loading: adminsLoading } = useAdmins();
    const { staff, loading: staffLoading } = useStaff();

    const loading = guestsLoading || adminsLoading || staffLoading;
    
    return (
        <div className="container mx-auto py-8">
             <header className="mb-8">
                <GradientTitle>User Management</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Promote users to administrators or assign staff roles. Any authenticated user can visit this page to bootstrap the first admin.
                </p>
            </header>
            <UserManagementClient 
                initialGuests={guests || []}
                initialAdmins={admins || []}
                initialStaff={staff || []}
                loading={loading}
            />
        </div>
    );
}
