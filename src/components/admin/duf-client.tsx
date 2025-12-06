
'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getDufDecisionAction } from '@/app/actions';
import { Loader2, Zap, Power, Bot, TrendingUp, CircleDollarSign } from 'lucide-react';
import type { DynamicUtilityFootprintOutput } from '@/ai/flows/dynamic-utility-footprint';
import type { Booking } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function DufClient({ checkedInBookings }: { checkedInBookings: any[] }) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DynamicUtilityFootprintOutput | null>(null);
  const { toast } = useToast();

  const handlePredict = async (bookingId?: string) => {
    const idToPredict = bookingId || selectedBookingId;
    if (!idToPredict) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a booking to analyze."
        });
        return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const res = await getDufDecisionAction(idToPredict);
      if (res.success) {
        setResult(res.decision);
      } else {
        throw new Error(res.error);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to get DUF decision.";
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectionChange = (bookingId: string) => {
      setSelectedBookingId(bookingId);
      // Automatically trigger analysis on selection for a smoother demo experience.
      handlePredict(bookingId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Power/> DUF Decision Engine</CardTitle>
        <CardDescription>
          Select a guest to simulate the AI's real-time utility management decision based on their predicted presence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Select onValueChange={handleSelectionChange} value={selectedBookingId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a checked-in guest..." />
            </SelectTrigger>
            <SelectContent>
                {checkedInBookings.length > 0 ? (
                    checkedInBookings.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                            {b.guestName} (Room {b.roomId})
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No guests are currently checked-in.</div>
                )}
            </SelectContent>
          </Select>
           <Button onClick={() => handlePredict()} disabled={isLoading || !selectedBookingId} className="w-full sm:w-auto">
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Re-Analyze
          </Button>
        </div>

        {isLoading && (
            <div className="flex flex-col items-center justify-center pt-12 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing guest signals & predicting presence...</p>
            </div>
        )}
        
        {result && !isLoading && (
          <div className="pt-6 border-t space-y-6">
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
  );
}

    