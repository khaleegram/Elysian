
'use client';

import { Booking, BookingStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { BedDouble, Calendar, CheckCircle, Hourglass, ShieldAlert, ShieldX, User } from "lucide-react";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { AuditTrail } from "./audit-trail";

const statusStyles: Record<BookingStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive', icon: React.ElementType }> = {
  [BookingStatus.Approved]: { variant: 'secondary', icon: CheckCircle },
  [BookingStatus.ReviewNeeded]: { variant: 'default', icon: Hourglass },
  [BookingStatus.Declined]: { variant: 'destructive', icon: ShieldX },
  [BookingStatus.CheckedIn]: { variant: 'default', icon: CheckCircle },
  [BookingStatus.CheckedOut]: { variant: 'secondary', icon: CheckCircle },
  [BookingStatus.Cancelled]: { variant: 'outline', icon: ShieldX },
};

const getRiskBadgeVariant = (score?: number) => {
    if (score === undefined) return 'secondary';
    if (score > 70) return 'destructive';
    if (score > 40) return 'default';
    return 'secondary';
}

type BookingDetailsProps = {
    booking: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; });
    asHeader?: boolean;
}

export function BookingDetails({ booking, asHeader = false }: BookingDetailsProps) {
    const statusConfig = statusStyles[booking.status];
    const StatusIcon = statusConfig?.icon;

    if (asHeader) {
        return (
            <div className="flex flex-col md:flex-row justify-between w-full pr-4 items-start md:items-center text-left">
                <div>
                    <p className="font-semibold">{booking.roomType} Room</p>
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.checkIn), 'MMM dd, yyyy')} - {format(new Date(booking.checkOut), 'MMM dd, yyyy')}
                    </p>
                </div>
                <Badge variant={statusConfig?.variant || 'secondary'} className="gap-1 mt-2 md:mt-0">
                    {StatusIcon && <StatusIcon className="h-3 w-3" />}
                    {booking.status}
                </Badge>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 pl-2 pt-2 border-l">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{booking.guestName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{booking.roomType} Room (Room {booking.roomId || 'N/A'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                         <span className="text-sm">{format(new Date(booking.checkIn), 'PPP')} to {format(new Date(booking.checkOut), 'PPP')}</span>
                    </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                        AI Fraud & Risk Analysis
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Fraud Score:</span>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant={getRiskBadgeVariant(booking.fraudScore)} className="cursor-help">
                                    {booking.fraudScore ? `${booking.fraudScore}/100` : 'N/A'}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{booking.fraudReasoning || 'No AI reasoning available.'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.fraudReasoning || 'Analysis not performed or not applicable.'}</p>
                </div>

                {booking.auditLog && booking.auditLog.length > 0 && (
                     <div>
                        <h4 className="font-semibold mb-2">Admin Audit Log</h4>
                        <AuditTrail logs={booking.auditLog} />
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
