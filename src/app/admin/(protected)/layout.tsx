
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BedDouble,
  BookCopy,
  Users,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  QrCode,
  Megaphone,
  BrainCircuit,
  TestTube,
} from 'lucide-react';
import { ElysianAILogo } from '@/components/icons';
import { AdminGate } from '@/components/admin/admin-gate';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/firebase';


const menuItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/admin/bookings', label: 'Bookings', icon: BookCopy },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/requests', label: 'Service Requests', icon: ClipboardList },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/scanner', label: 'QR Scanner', icon: QrCode },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/duf', label: 'DUF Monitor', icon: BrainCircuit },
  { href: '/admin/simulations/duf', label: 'AI Simulations', icon: TestTube },
  { href: '/billboard', label: 'Billboard', icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useUser();
  const displayName = user?.displayName || user?.email || 'Admin';
  const displayEmail = user?.email || '';

  return (
    <AdminGate>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <ElysianAILogo className="size-6" />
                <span className="text-lg font-semibold">ElysianAI</span>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} target={item.label === 'Billboard' ? '_blank' : '_self'}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' || pathname === item.href)}
                        tooltip={item.label}
                        className="justify-start"
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin/settings">
                             <SidebarMenuButton
                                isActive={pathname === '/admin/settings'}
                                tooltip="Settings"
                                className="justify-start"
                                >
                                <Settings className="size-4" />
                                <span>Settings</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <div className="flex items-center gap-2 p-2">
                           <Avatar className="h-8 w-8">
                                <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-sm">
                                <span className="font-medium">{displayName}</span>
                                <span className="text-muted-foreground text-xs">{displayEmail}</span>
                            </div>
                        </div>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
              <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <ElysianAILogo className="size-6" />
                <span className="">ElysianAI</span>
              </Link>
              <SidebarTrigger />
            </header>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
    </AdminGate>
  );
}
