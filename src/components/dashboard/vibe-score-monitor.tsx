
'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { predictVibeScoreAction, getDufDecisionAction } from '@/app/actions';
import { Loader2, Sparkles, HeartPulse, AlertTriangle, ShieldCheck, BrainCircuit } from 'lucide-react';
import type { VibeScoreOutput } from '@/ai/flows/vibe-score-predictor';
import type { DynamicUtilityFootprintOutput } from '@/ai/flows/dynamic-utility-footprint';
import type { Booking } from '@/lib/types';
import { Progress } from '../ui/progress';

const riskMap = {
  "Low": { icon: ShieldCheck, color: "text-green-500" },
  "Medium": { icon: AlertTriangle, color: "text-yellow-500" },
  "High": { icon: AlertTriangle, color: "text-orange-500" },
  "Critical": { icon: AlertTriangle, color: "text-red-500" },
};

interface VibeScoreMonitorProps {
    guests: Booking[];
    singleGuestId?: string; // If provided, locks the component to this guest
}

export function VibeScoreMonitor({ guests, singleGuestId }: VibeScoreMonitorProps) {
  const [selectedGuestId, setSelectedGuestId] = useState<string | undefined>(singleGuestId);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VibeScoreOutput | null>(null);
  const [dufResult, setDufResult] = useState<DynamicUtilityFootprintOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedBooking = guests.find(g => g.guestId === selectedGuestId);

  useEffect(() => {
    if (singleGuestId) {
        setSelectedGuestId(singleGuestId);
        handlePredict(singleGuestId);
    }
  }, [singleGuestId]);

  const handlePredict = async (guestId: string) => {
    if (!guestId) return;

    setIsLoading(true);
    setResult(null);
    setDufResult(null);
    setError(null);
    try {
        const [vibeRes, dufRes] = await Promise.all([
             predictVibeScoreAction(guestId),
             getDufDecisionAction(guestId)
        ]);
        
      if (vibeRes.success) {
        setResult(vibeRes.response);
      } else {
        throw new Error(vibeRes.error || "Failed to predict vibe score.");
      }

       if (dufRes.success) {
        setDufResult(dufRes.decision);
      } else {
        // Don't throw, just log. Vibe is more critical here.
        console.error("DUF Error:", dufRes.error);
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run AI analysis.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectionChange = (guestId: string) => {
      setSelectedGuestId(guestId);
      handlePredict(guestId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HeartPulse/> AI Vibe & Utility</CardTitle>
        <CardDescription>
          Proactively predict guest satisfaction and energy usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!singleGuestId && (
            <div className="flex items-center gap-2">
            <Select onValueChange={handleSelectionChange} value={selectedGuestId}>
                <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a guest to analyze..." />
                </SelectTrigger>
                <SelectContent>
                    {guests.length > 0 ? (
                        guests.map(g => (
                            <SelectItem key={g.id} value={g.guestId}>
                                {g.guestName} (Room {g.roomId})
                            </SelectItem>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">No guests are currently checked-in.</div>
                    )}
                </SelectContent>
            </Select>
            </div>
        )}
        {(singleGuestId && !result && !isLoading) && (
             <Button onClick={() => handlePredict(singleGuestId)} className="w-full">
                <HeartPulse className="mr-2 h-4 w-4" /> Analyze Guest Vibe
            </Button>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center pt-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing guest signals...</p>
            </div>
        )}

        {error && <p className="text-sm text-destructive pt-4">{error}</p>}
        
        {result && !isLoading && (
          <div className="pt-4 border-t space-y-6">
             <div className="space-y-4">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Vibe Score</p>
                    <p className="text-5xl font-bold">{result.vibeScore}<span className="text-xl text-muted-foreground">/10</span></p>
                    <Progress value={result.vibeScore * 10} className="mt-2 h-2" />
                </div>
                 <div className="text-center">
                    <p className="text-sm text-muted-foreground">Escalation Risk</p>
                    <p className={`mt-1 text-xl font-bold ${riskMap[result.escalationRisk].color}`}>{result.escalationRisk}</p>
                </div>
            </div>

             <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">AI-Suggested Action</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-primary">"{result.suggestedAction}"</p>
                </CardContent>
            </Card>
            
            {dufResult && (
                 <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2"><BrainCircuit className="h-4 w-4"/> DUF Decision</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-primary">"{dufResult.decision}"</p>
                        <p className="text-xs text-muted-foreground mt-1">Reason: {dufResult.reasoning.split('*')[1] || 'Analysis complete.'}</p>
                    </CardContent>
                </Card>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
