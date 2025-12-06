
// components/booking/BookingLayout.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { GradientTitle } from '../ui/gradient-title';
import { User, Check, CreditCard } from 'lucide-react';

const steps = [
    { id: 1, name: 'Guest Details', icon: User },
    { id: 2, name: 'Review & Confirm', icon: Check },
    { id: 3, name: 'Payment', icon: CreditCard },
];

export function BookingLayout({
    currentStep,
    totalSteps,
    children
}: {
    currentStep: number;
    totalSteps: number;
    children: React.ReactNode;
}) {
    const isSuccessStep = currentStep > totalSteps;

    return (
        <div className="container mx-auto py-12 min-h-[60vh]">
            <header className="mb-8">
                <GradientTitle>
                    Complete Your Booking
                </GradientTitle>
            </header>
            
            <div className="flex flex-col lg:flex-row gap-10">
                
                {!isSuccessStep && (
                    <nav className="lg:w-1/4">
                        <ol className="space-y-4">
                            {steps.map((step) => {
                                const StepIcon = step.icon;
                                return (
                                <li 
                                    key={step.id} 
                                    className={cn(
                                        'flex items-center space-x-3 transition-colors duration-200',
                                        currentStep === step.id ? 'text-primary font-semibold' : 'text-gray-500',
                                        currentStep > step.id && 'text-green-600'
                                    )}
                                >
                                    <span 
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border',
                                            currentStep === step.id 
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : currentStep > step.id
                                                    ? 'bg-green-100 text-green-600 border-green-600'
                                                    : 'bg-white border-gray-300'
                                        )}
                                    >
                                        {currentStep > step.id ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                    </span>
                                    <span>{step.name}</span>
                                </li>
                            )})}
                        </ol>
                    </nav>
                )}

                <main className={cn("flex-grow", isSuccessStep ? "max-w-xl mx-auto" : "lg:w-3/4 max-w-4xl")}>
                    <div className="border rounded-lg p-8 shadow-lg bg-card text-card-foreground">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
