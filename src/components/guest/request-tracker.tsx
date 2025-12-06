'use client';

import { ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatRelative } from 'date-fns';
import { Utensils, Wind, CheckCircle, Loader2, Clock, Wrench } from 'lucide-react';
import { useMemo } from 'react';

const statusMap: Record<ServiceRequestStatus, { icon: React.ElementType, color: string, variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    'Pending': { icon: Clock, color: 'text-yellow-500', variant: 'outline' },
    'In-Progress': { icon: Loader2, color: 'text-blue-500', variant: 'default' },
    'Completed': { icon: CheckCircle, color: 'text-green-500', variant: 'secondary' },
};

const typeIconMap: Record<string, React.ElementType> = {
    'Room Service': Utensils,
    'Housekeeping': Wind,
    'Maintenance': Wrench,
};

type RequestTrackerProps = {
  requests: (Omit<ServiceRequest, 'createdAt'> & { createdAt: Date; })[];
}

export function RequestTracker({ requests: initialRequests }: RequestTrackerProps) {

  const requests = useMemo(() => {
    if (!initialRequests) return [];
    return initialRequests.map(r => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)
    }));
  }, [initialRequests]);

  if (requests.length === 0) {
    return (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                You haven't made any requests yet.
            </CardContent>
        </Card>
    );
  }
  
  const sortedRequests = [...requests].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request History</CardTitle>
        <CardDescription>Follow the status of your requests here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {sortedRequests.map((request, index) => {
                const StatusIcon = statusMap[request.status].icon;
                const TypeIcon = typeIconMap[request.type] || Utensils;
                const isValidDate = request.createdAt && !isNaN(request.createdAt.getTime());
                
                return (
                    <div key={request.id} className="relative flex gap-4">
                        <div className="absolute left-5 top-5 h-full w-px bg-border -z-10"/>
                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                             <TypeIcon className="h-5 w-5 text-secondary-foreground" />
                         </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{request.type}</h3>
                                    <p className="text-muted-foreground text-sm">{request.description}</p>
                                </div>
                                <Badge variant={statusMap[request.status].variant}>
                                    <StatusIcon className={`h-3 w-3 mr-1.5 ${statusMap[request.status].color} ${request.status === 'In-Progress' ? 'animate-spin' : ''}`} />
                                    {request.status}
                                </Badge>
                            </div>
                            {isValidDate && (
                                <p className="text-xs text-muted-foreground mt-1">{formatRelative(request.createdAt, new Date())}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

    