
'use client';
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { redirect, usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useRole } from "@/hooks/use-role";


export function AdminLayoutClient({ children }: { children: ReactNode }) {
    const user = useUser();
    const { role, loading: roleLoading } = useRole();
    const pathname = usePathname();

    const isLoading = user === undefined || roleLoading;

    useEffect(() => {
        if (isLoading) {
            return;
        }

        // If not authenticated and not on the user management page (for bootstrapping), redirect to unified login.
        if (user === null && !pathname.includes('/admin/users')) {
            redirect('/login');
        }
        
    }, [user, isLoading, pathname]);

    if (isLoading && !pathname.includes('/admin/users')) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // Always render children to allow access to user page or authenticated content
    return <>{children}</>;
}
