
import { Suspense } from 'react';
import { Room, RoomType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BedDouble, Wifi, Tv, Wind, DollarSign, ArrowRight, XCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAvailableRoomsForType } from '@/lib/data';
import { GradientTitle } from '@/components/ui/gradient-title';

function RoomCard({ room, checkIn, checkOut }: { room: Room, checkIn: string, checkOut: string }) {
    // This is a simplified placeholder logic.
    const placeholder = PlaceHolderImages.find(p => p.imageHint.includes(room.type.toLowerCase()));
    
    const bookingUrl = `/booking?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`;

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                    <Image
                        src={placeholder?.imageUrl || `https://picsum.photos/seed/${room.id}/400/200`}
                        alt={placeholder?.description || `A luxurious ${room.type} room.`}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint={`${room.type.toLowerCase()} hotel room`}
                    />
                </div>
                <div className="p-6 pb-0">
                    <CardTitle>{room.type} Room</CardTitle>
                    <CardDescription>Room #{room.number}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> 1 King Bed</div>
                    <div className="flex items-center gap-1"><Wifi className="h-4 w-4" /> Free Wifi</div>
                    <div className="flex items-center gap-1"><Tv className="h-4 w-4" /> 55" TV</div>
                    <div className="flex items-center gap-1"><Wind className="h-4 w-4" /> A/C</div>
                </div>
                 <p className="text-sm">A comfortable and elegant space, perfect for your stay. Enjoy premium amenities and a serene atmosphere.</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="font-bold text-lg flex items-center"><DollarSign className="h-5 w-5" />{room.price}<span className="text-sm font-normal text-muted-foreground">/night</span></div>
                <Button asChild>
                    <Link href={bookingUrl}>
                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

async function SearchResults({ checkIn, checkOut, roomType }: { checkIn: string, checkOut: string, roomType: RoomType }) {
    
    if (!checkIn || !checkOut || !roomType) {
        return <p>Missing search criteria. Please go back and try again.</p>;
    }
    
    const rooms = await getAvailableRoomsForType(roomType, new Date(checkIn), new Date(checkOut));

    return (
        <div className="container mx-auto py-12">
            <header className="mb-8">
                <GradientTitle>Available Rooms</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground">
                    Showing available <span className="font-bold text-primary">{roomType}</span> rooms for your selected dates.
                </p>
            </header>

            {rooms && rooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {rooms.map(room => (
                        <RoomCard key={room.id} room={room} checkIn={checkIn} checkOut={checkOut} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <CardHeader>
                        <XCircle className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="mt-4">No Rooms Available</CardTitle>
                        <CardDescription>
                            Unfortunately, there are no {roomType} rooms available for the selected dates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Please try adjusting your dates or room type.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

type SearchPageProps = {
    searchParams: {
        checkIn?: string;
        checkOut?: string;
        roomType?: string;
    }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { checkIn, checkOut, roomType } = searchParams;
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <SearchResults checkIn={checkIn!} checkOut={checkOut!} roomType={roomType as RoomType} />
        </Suspense>
    );
}
