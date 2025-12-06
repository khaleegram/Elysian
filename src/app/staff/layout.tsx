
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
} from 'lucide-react';
import { ElysianAILogo } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser, useAuth } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

function StaffGate({ children }: { children: React.ReactNode }) {
    const { role, loading } = useRole();

    if (loading) {
        return (
             <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <span className="sr-only">Verifying staff access...</span>
            </div>
        )
    }
    
    if (role !== 'staff') {
        redirect('/login');
        return null;
    }
    
    return <>{children}</>;
}


export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  const displayName = user?.displayName || user?.email || 'Staff';
  
  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'Signed Out' });
    redirect('/login');
  }

  return (
    <StaffGate>
        <div className="flex min-h-screen">
            <aside className="w-64 flex-col border-r bg-background hidden md:flex">
                 <div className="flex h-16 items-center gap-2 border-b px-6">
                    <ElysianAILogo className="size-6 text-primary" />
                    <span className="text-lg font-semibold">Staff Portal</span>
                </div>
                 <nav className="flex-1 p-4">
                    <Link href="/staff/dashboard">
                        <Button variant={pathname === '/staff/dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2">
                            <ClipboardList className="h-4 w-4" />
                            My Assignments
                        </Button>
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 mb-4">
                         <Avatar className="h-10 w-10">
                            <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-sm">
                            <span className="font-medium">{displayName}</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col">
                 <header className="flex h-16 items-center border-b bg-background px-6 md:hidden">
                    <div className="flex items-center gap-2">
                        <ElysianAILogo className="size-6 text-primary" />
                        <span className="text-lg font-semibold">Staff Portal</span>
                    </div>
                </header>
                <div className="flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    </StaffGate>
  );
}
