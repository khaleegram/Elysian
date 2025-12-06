'use client';

import Image from 'next/image';
import { HeroBookingForm } from '@/components/booking/hero-booking-form';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-gray-200">
      <div className="absolute inset-0 h-full w-full">
        <Image
            src="/images/background.jpg"
            alt="Luxurious hotel exterior"
            fill
            className="object-cover"
            priority
            data-ai-hint="hotel exterior"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="absolute inset-0 h-full w-full">
        <Image
          src="/images/overlay.png"
          alt="Transparent texture overlay"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl text-center space-y-8">
            <div>
              <h1 className="font-headline text-8xl md:text-9xl font-extralight tracking-tighter bg-gradient-to-b from-[#DFC4A8] to-[#796A5B] bg-clip-text text-transparent">
                Elysian
              </h1>
              <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-100 md:text-xl">
                Find your perfect stay – curated hotels, unbeatable prices, and seamless bookings for your next getaway.
              </p>
            </div>

            <Card className="w-full bg-white/90 p-2 shadow-2xl backdrop-blur-sm text-card-foreground">
                <CardContent className="p-0">
                    <HeroBookingForm />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
