
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getDynamicUtilityFootprintDecision, type DynamicUtilityFootprintInput, type DynamicUtilityFootprintOutput } from '@/ai/flows/dynamic-utility-footprint';
import { Loader2, Zap, BrainCircuit, TrendingUp, CircleDollarSign, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GradientTitle } from '@/components/ui/gradient-title';

const defaultInput: DynamicUtilityFootprintInput = {
    roomId: "405",
    guestStayProfile: "Business traveler, typically leaves at 8:30 AM and returns around 6:00 PM.",
    lastCredentialUsage: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    recentServiceRequests: ["Ordered room service for breakfast at 7:00 AM."],
    inHotelActivity: "No in-hotel facility usage detected in the last 5 hours.",
    guestPreferences: {
        preferredTemperature: 68,
    },
};

export default function DufSimulationPage() {
    const [formState, setFormState] = useState<DynamicUtilityFootprintInput>(defaultInput);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DynamicUtilityFootprintOutput | null>(null);
    const { toast } = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'preferredTemperature') {
             setFormState(prev => ({ ...prev, guestPreferences: { preferredTemperature: Number(value) } }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleArrayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value.split('\n') }));
    }

    const handleSimulate = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const decision = await getDynamicUtilityFootprintDecision(formState);
            setResult(decision);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to get DUF decision.";
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>DUF Engine Simulator</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    Manually adjust inputs to test the AI's predictive utility management decisions.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Simulation Inputs</CardTitle>
                        <CardDescription>Modify these values to see how they affect the AI's decision.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="roomId">Room ID</Label>
                                <Input id="roomId" name="roomId" value={formState.roomId} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="preferredTemperature">Preferred Temp (°F)</Label>
                                <Input id="preferredTemperature" name="preferredTemperature" type="number" value={formState.guestPreferences.preferredTemperature} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastCredentialUsage">Last Credential Usage (ISO String)</Label>
                            <Input id="lastCredentialUsage" name="lastCredentialUsage" value={formState.lastCredentialUsage} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guestStayProfile">Guest Stay Profile</Label>
                            <Textarea id="guestStayProfile" name="guestStayProfile" value={formState.guestStayProfile} onChange={handleInputChange} rows={3} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="recentServiceRequests">Recent Service Requests (one per line)</Label>
                            <Textarea id="recentServiceRequests" name="recentServiceRequests" value={formState.recentServiceRequests.join('\n')} onChange={handleArrayChange} rows={2} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inHotelActivity">In-Hotel Activity</Label>
                            <Textarea id="inHotelActivity" name="inHotelActivity" value={formState.inHotelActivity} onChange={handleInputChange} rows={2} />
                        </div>
                        <Button onClick={handleSimulate} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                            Run Simulation
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Output</CardTitle>
                        <CardDescription>The AI's resulting decision and reasoning will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isLoading && (
                            <div className="flex flex-col items-center justify-center pt-12 space-y-2 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <p className="text-sm">Analyzing inputs and generating decision...</p>
                            </div>
                        )}
                        
                        {result && !isLoading && (
                            <div className="space-y-6">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-xl flex items-center gap-2"><Bot className="h-5 w-5"/> AI Decision</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold text-primary text-center">"{result.decision}"</p>
                                    </CardContent>
                                </Card>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4"/>Reasoning</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {result.reasoning.split('*').slice(1).map((item, index) => (
                                                        <li key={index}>{item.trim()}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold flex items-center gap-2"><CircleDollarSign className="h-4 w-4"/>Financial Impact</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Predicted Savings</p>
                                                <p className="text-2xl font-bold">{result.costBenefit.split('$')[1].split(' ')[0]} USD</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Follow-up Action</p>
                                                <p className="font-semibold">{result.actionTrigger}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
         </div>
    );
}
