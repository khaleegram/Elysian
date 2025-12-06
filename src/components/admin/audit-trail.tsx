
'use client';

import { AuditLogEntry } from "@/lib/types";
import { formatRelative } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { User, Edit, Check, ShieldX } from "lucide-react";

const getIconForAction = (action: string) => {
    if (action.includes('Approved')) return <Check className="h-4 w-4 text-green-500" />;
    if (action.includes('Declined')) return <ShieldX className="h-4 w-4 text-destructive" />;
    if (action.includes('Status changed')) return <Edit className="h-4 w-4 text-blue-500" />;
    return <User className="h-4 w-4" />;
}

export function AuditTrail({ logs }: { logs: any[] }) {
    if (!logs || logs.length === 0) {
        return <p className="text-sm text-muted-foreground">No administrative actions have been logged for this booking.</p>;
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <ScrollArea className="h-48 w-full rounded-md border p-4">
            <div className="space-y-4">
                {sortedLogs.map((log, index) => {
                    const Icon = getIconForAction(log.action);
                    return (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary mt-1">
                                {Icon}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">
                                    {log.action}
                                    <span className="font-normal text-muted-foreground"> by {log.adminName}</span>
                                </p>
                                {log.notes && (
                                    <p className="text-xs text-muted-foreground border-l-2 pl-2 mt-1">{log.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatRelative(new Date(log.timestamp), new Date())}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
