
'use client';

import { Guest, Booking } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookingDetails } from "./booking-details";
import { GradientTitle } from "../ui/gradient-title";
import { History, Mail, Phone } from "lucide-react";

type GuestProfileClientProps = {
    guest: Guest;
    bookings: (Omit<Booking, 'checkIn' | 'checkOut' | 'createdAt'> & { checkIn: string; checkOut: string; createdAt: string | null; })[];
}

export function GuestProfileClient({ guest, bookings }: GuestProfileClientProps) {

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-3xl">{guest.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <GradientTitle>{guest.name}</GradientTitle>
                    <p className="text-lg text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> {guest.email}</p>
                    {guest.phone && <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> {guest.phone}</p>}
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/> Booking History</CardTitle>
                    <CardDescription>A complete record of all stays for {guest.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    {bookings.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {bookings.map(booking => (
                                <AccordionItem value={booking.id} key={booking.id}>
                                    <AccordionTrigger>
                                        <BookingDetails booking={booking} asHeader={true} />
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <BookingDetails booking={booking} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No booking history found for this guest.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
