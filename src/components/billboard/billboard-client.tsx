
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useCollection } from '@/firebase/hooks';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Assignment, ServiceRequest, Booking, Staff, AssignmentStatus } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { textToSpeechAction } from '@/app/actions';
import { ElysianAILogo } from '../icons';
import { Megaphone, Wrench, Utensils, Wind, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type EnrichedAssignment = Assignment & {
  staffName: string;
  roomNumber: string;
  requestType: string;
};

const TypeIconMap: Record<string, React.ElementType> = {
    'Maintenance': Wrench,
    'Room Service': Utensils,
    'Housekeeping': Wind,
};

const StatusIconMap: Record<AssignmentStatus, React.ElementType> = {
    'Assigned': Clock,
    'Completed': Check,
};


const playAnnouncement = async (text: string) => {
    // Repeat the announcement three times
    for (let i = 0; i < 3; i++) {
        try {
            const result = await textToSpeechAction(text);
            if (result.success && result.audio) {
                const audio = new Audio(result.audio);
                // Wait for one announcement to finish before starting the next
                await new Promise<void>(resolve => {
                    audio.onended = () => resolve();
                    audio.play();
                });
                // Optional delay between repetitions
                if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                throw new Error(result.error || 'Failed to generate audio.');
            }
        } catch (error) {
            console.error("TTS Error on repetition", i, ":", error);
            // Don't stop the whole loop if one repetition fails
        }
    }
};

export function BillboardClient({
    initialAssignments,
    initialServiceRequests,
    initialBookings,
    initialStaff,
}: {
    initialAssignments: any[],
    initialServiceRequests: any[],
    initialBookings: any[],
    initialStaff: any[],
}) {
    const firestore = useFirestore();
    const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(initialAssignments.length > 0 ? initialAssignments[0].id : null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const assignmentsQuery = useMemo(() => 
        firestore ? query(collection(firestore, 'assignments'), orderBy('assignedAt', 'desc'), limit(10)) : null
    , [firestore]);

    const { data: assignments } = useCollection<Assignment>(assignmentsQuery, initialAssignments);

    const enrichedAssignments = useMemo(() => {
        if (!assignments) return [];
        return assignments.map(assignment => {
            const request = initialServiceRequests.find(r => r.id === assignment.serviceRequestId);
            const booking = initialBookings.find(b => b.id === request?.bookingId);
            const staff = initialStaff.find(s => s.id === assignment.staffId);
            return {
                ...assignment,
                staffName: staff?.name || 'Unknown Staff',
                roomNumber: booking?.roomId || 'N/A',
                requestType: request?.type || 'Unknown Request',
            } as EnrichedAssignment;
        });
    }, [assignments, initialServiceRequests, initialBookings, initialStaff]);

    useEffect(() => {
        if (enrichedAssignments && enrichedAssignments.length > 0) {
            const latestAssignment = enrichedAssignments[0];
            if (latestAssignment.id !== lastAnnouncedId && latestAssignment.status === 'Assigned') {
                const announcementText = `Attention: ${latestAssignment.staffName}, please proceed to Room ${latestAssignment.roomNumber} for a ${latestAssignment.requestType} request.`;
                playAnnouncement(announcementText);
                setLastAnnouncedId(latestAssignment.id);
            }
        }
    }, [enrichedAssignments, lastAnnouncedId]);

    const getFormattedTime = (assignedAt: any) => {
        if (!assignedAt) return '--:--';
        try {
            const date = assignedAt.toDate ? assignedAt.toDate() : new Date(assignedAt);
            if (isNaN(date.getTime())) return '--:--';
            return format(date, 'HH:mm');
        } catch (error) {
            console.error("Failed to format date:", assignedAt, error);
            return '--:--';
        }
    };


    return (
        <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <ElysianAILogo className="h-12 w-12 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-b from-[#DFC4A8] to-[#796A5B] bg-clip-text text-transparent">Assignment Billboard</h1>
                        <p className="text-gray-400">Live Staff Assignments</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-mono">{format(currentTime, 'HH:mm:ss')}</p>
                    <p className="text-lg text-gray-400">{format(currentTime, 'eeee, MMMM d')}</p>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {enrichedAssignments.map((assignment, index) => {
                        const Icon = TypeIconMap[assignment.requestType] || Megaphone;
                        const StatusIcon = StatusIconMap[assignment.status] || Megaphone;
                        const isPrimary = index === 0 && assignment.status === 'Assigned';
                        return (
                        <motion.div
                            key={assignment.id}
                            layout
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className={cn(
                                'rounded-xl border-2 p-6 shadow-lg transition-all duration-300',
                                isPrimary
                                  ? 'bg-primary/10 border-primary shadow-primary/20 lg:col-span-2'
                                  : 'bg-gray-800/50 border-gray-700',
                                assignment.status === 'Completed' && 'opacity-50'
                              )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isPrimary ? 'bg-primary' : 'bg-gray-700'}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className={`font-bold ${isPrimary ? 'text-3xl' : 'text-xl'}`}>{assignment.staffName}</p>
                                    <p className={`mt-1 ${isPrimary ? 'text-2xl' : 'text-lg'}`}>
                                        <span className="text-gray-400">Room</span> {assignment.roomNumber}
                                    </p>
                                    <p className="text-lg text-gray-300">
                                        <span className="text-gray-400">Task:</span> {assignment.requestType}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="text-sm text-gray-500 font-mono">{getFormattedTime(assignment.assignedAt)}</p>
                                     <Badge variant={assignment.status === 'Completed' ? 'secondary' : 'default'} className="flex items-center gap-1.5">
                                        <StatusIcon className="h-3 w-3" />
                                        {assignment.status}
                                    </Badge>
                                </div>
                            </div>
                        </motion.div>
                    )})}
                </AnimatePresence>
            </main>
        </div>
    );
}
