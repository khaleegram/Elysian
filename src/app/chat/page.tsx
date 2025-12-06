
import { ChatBookingClient } from "@/components/booking/chat-booking-client";
import { GradientTitle } from "@/components/ui/gradient-title";

export default function ChatPage() {
    return (
        <div className="container mx-auto py-12">
            <header className="text-center mb-8">
                <GradientTitle>Book with AI</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground">
                    Just tell our AI assistant what you're looking for.
                </p>
            </header>
            <ChatBookingClient />
        </div>
    );
}
