
'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { predictVibeScoreAction } from '@/app/actions';
import { Loader2, Sparkles, HeartPulse, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { VibeScoreOutput } from '@/ai/flows/vibe-score-predictor';
import type { Booking } from '@/lib/types';
import { Progress } from '../ui/progress';

const riskMap = {
  "Low": { icon: ShieldCheck, color: "text-green-500" },
  "Medium": { icon: AlertTriangle, color: "text-yellow-500" },
  "High": { icon: AlertTriangle, color: "text-orange-500" },
  "Critical": { icon: AlertTriangle, color: "text-red-500" },
};

export function VibeScoreMonitor({ guests }: { guests: Booking[] }) {
  const [selectedGuestId, setSelectedGuestId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VibeScoreOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (guestId?: string) => {
    const idToPredict = guestId || selectedGuestId;
    if (!idToPredict) return;

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await predictVibeScoreAction(idToPredict);
      if (res.success) {
        setResult(res.response);
      } else {
        setError(res.error || "An unknown error occurred.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to predict vibe score.");
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
        <CardTitle className="flex items-center gap-2"><HeartPulse/> AI Vibe Score</CardTitle>
        <CardDescription>
          Proactively predict guest satisfaction. Select a currently checked-in guest to analyze their "vibe".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {isLoading && (
            <div className="flex flex-col items-center justify-center pt-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing guest signals...</p>
            </div>
        )}

        {error && <p className="text-sm text-destructive pt-4">{error}</p>}
        
        {result && !isLoading && (
          <div className="pt-4 border-t space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-normal text-muted-foreground">Vibe Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-5xl font-bold">{result.vibeScore}<span className="text-xl text-muted-foreground">/10</span></p>
                        <Progress value={result.vibeScore * 10} className="mt-2 h-2" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-normal text-muted-foreground">Escalation Risk</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        {(() => {
                            const RiskIcon = riskMap[result.escalationRisk].icon;
                            const riskColor = riskMap[result.escalationRisk].color;
                            return (
                                <>
                                    <RiskIcon className={`h-10 w-10 ${riskColor}`} />
                                    <p className={`mt-2 text-xl font-bold ${riskColor}`}>{result.escalationRisk}</p>
                                </>
                            )
                        })()}
                    </CardContent>
                </Card>
                 <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">AI-Suggested Action</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium text-primary text-center">"{result.suggestedAction}"</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                        <pre className="whitespace-pre-wrap font-sans text-sm bg-transparent p-0 border-0">{result.reasoning}</pre>
                    </div>
                </CardContent>
            </Card>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
