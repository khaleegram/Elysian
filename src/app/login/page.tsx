
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { AuthFormClient } from "@/components/auth/auth-form-client";
import { GradientTitle } from "@/components/ui/gradient-title";
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const user = useUser();
    const { role, loading: roleLoading } = useRole();
    const router = useRouter();

    const isLoading = user === undefined || roleLoading;

    useEffect(() => {
        if (isLoading) return;

        if (user) {
            if (role === 'admin') {
                router.replace('/admin/dashboard');
            } else if (role === 'staff') {
                router.replace('/staff/dashboard');
            }
            else {
                // Default redirect for guests or if role is not yet determined
                router.replace('/');
            }
        }
    }, [user, role, isLoading, router]);

    // Show a loader while checking auth status or if user is logged in and redirecting
    if (isLoading || user) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    // Only show the login form if there is no user
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <div className="mx-auto grid w-[450px] gap-6">
                <div className="grid gap-2 text-center">
                    <GradientTitle className="text-5xl">ElysianAI Portal</GradientTitle>
                    <p className="text-balance text-muted-foreground">
                        Sign in to access your dashboard or manage your stay.
                    </p>
                </div>
                <AuthFormClient />
            </div>
        </div>
    );
}
