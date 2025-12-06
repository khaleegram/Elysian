
'use client';

import { useUser } from "@/firebase";
import { useRole } from "@/hooks/use-role";
import { Loader2 } from "lucide-react";
import { redirect, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

/**
 * This layout protects general application routes that are for authenticated GUESTS.
 * It redirects unauthenticated users to the login page.
 * Crucially, it now also checks if a user is an admin and does NOT block them,
 * allowing the AdminGate to handle them.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
    const user = useUser();
    const { role, loading: roleLoading } = useRole();
    const pathname = usePathname();

    const isLoading = user === undefined || roleLoading;

    useEffect(() => {
        if (isLoading) {
            return; // Wait until all auth/role checks are complete
        }

        // If the user has an 'admin' role, they should not be in the general app section.
        // Redirect them to their dashboard. This prevents admins from seeing guest pages.
        if (role === 'admin') {
            redirect('/admin/dashboard');
            return;
        }

        // If auth state is resolved, there's no user, redirect to login.
        if (user === null) {
            redirect('/login');
        }

    }, [user, role, isLoading, pathname]);

    // While auth state is initializing, show a loader.
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    // If a user is logged in AND they are a guest, show the content.
    if (user && role === 'guest') {
        return <>{children}</>;
    }

    // This will be shown briefly during the redirect or if something goes wrong.
    return null;
}
