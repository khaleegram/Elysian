
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Menu, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useState } from 'react';
import { ElysianAILogo } from './icons';
import { useUser, useAuth } from '@/firebase';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/use-role';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/booking/search?roomType=Standard', label: 'Rooms' },
];

function AuthButton() {
    const user = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const { role } = useRole();
    const pathname = usePathname();

    if (user === undefined) {
        return <Button variant="ghost" size="icon" className="rounded-full"><div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div></Button>
    }

    const handleSignOut = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({ title: "Signed Out", description: "You have been successfully signed out." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Sign Out Failed", description: "Could not sign you out. Please try again." });
        }
    }

    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {role === 'admin' ? (
                         <DropdownMenuItem asChild><Link href="/admin/dashboard">Admin Dashboard</Link></DropdownMenuItem>
                    ) : (
                         <DropdownMenuItem asChild><Link href="/bookings">My Bookings</Link></DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <Button asChild className="bg-gray-800 text-white hover:bg-gray-700 rounded-full">
            <Link href="/login">
                Sign In
            </Link>
        </Button>
    )

}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTransparent = pathname === '/';

  return (
    <header className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
         "py-3"
    )}>
      <div className="container mx-auto flex h-full items-center justify-between">
        <div className={cn("header-element-container", isTransparent ? "text-white" : "text-black")}>
            <Link href="/" className="flex items-center space-x-2">
                <ElysianAILogo className="h-7 w-7" />
                <span className="text-2xl font-bold tracking-tight font-headline">
                    ElysianAI
                </span>
            </Link>
        </div>
        
        {/* Center Aligned Nav */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <nav className="header-element-container">
                {navLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        'nav-link',
                        pathname === link.href && "nav-link-active"
                    )}
                    >
                    {link.label}
                    </Link>
                ))}
            </nav>
        </div>
        
        {/* Right Aligned Auth */}
        <div className="flex items-center justify-end gap-2">
            <div className="hidden md:block">
              <AuthButton />
            </div>
            <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className={cn("h-6 w-6", isTransparent ? "text-white" : "text-black")} />
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="bg-white/90">
                        <nav className="mt-8 flex flex-col gap-4">
                            {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                'text-lg font-medium text-gray-500',
                                pathname === link.href ? 'text-black font-bold' : ''
                                )}
                            >
                                {link.label}
                            </Link>
                            ))}
                        </nav>
                         <div className="mt-8 border-t pt-6">
                            <AuthButton />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>

      </div>
    </header>
  );
}
