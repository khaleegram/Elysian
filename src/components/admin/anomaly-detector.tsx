
'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { detectAnomaliesAction } from '@/app/actions';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnomalyDetectionOutput } from '@/ai/flows/anomaly-detection-with-explainable-alerts';
import { Badge } from '../ui/badge';

type Anomaly = AnomalyDetectionOutput['anomalies'][0];

const severityMap = {
    "Low": { variant: 'secondary', icon: AlertTriangle },
    "Medium": { variant: 'default', icon: AlertTriangle, className: 'bg-yellow-400/20 text-yellow-600 border-yellow-400/50' },
    "High": { variant: 'default', icon: AlertTriangle, className: 'bg-orange-400/20 text-orange-600 border-orange-400/50' },
    "Critical": { variant: 'destructive', icon: AlertTriangle },
};


export function AnomalyDetector() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnomalyDetectionOutput | null>(null);
    const { toast } = useToast();

    const handleScan = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const res = await detectAnomaliesAction();
            if (res.success) {
                setResult({ anomalies: res.anomalies });
                toast({
                    title: 'Scan Complete',
                    description: `Found ${res.anomalies.length} potential anomalies.`,
                });
            } else {
                throw new Error(res.error);
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to scan for anomalies.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap /> AI Anomaly Detection</CardTitle>
                <CardDescription>
                    Scan recent operational data to identify unusual patterns, potential fraud, or emerging maintenance issues that might require your attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleScan} disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Scan for Anomalies
                </Button>

                {result && (
                    <div className="mt-6 space-y-4">
                        {result.anomalies.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No significant anomalies detected. Everything looks normal.</p>
                            </div>
                        ) : (
                            result.anomalies.map((anomaly, index) => (
                                <AnomalyCard key={index} anomaly={anomaly} />
                            ))
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
    const severityInfo = severityMap[anomaly.severity];
    const SeverityIcon = severityInfo.icon;
    return (
        <Card className="bg-muted/50">
            <CardHeader>
                <div className="flex justify-between items-start">
                     <CardTitle className="text-lg">{anomaly.title}</CardTitle>
                     <Badge variant={severityInfo.variant} className={severityInfo.className}>
                        <SeverityIcon className="mr-1.5 h-3 w-3" />
                        {anomaly.severity}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm">Explanation</h4>
                    <p className="text-sm text-muted-foreground">{anomaly.explanation}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm">Suggested Action</h4>
                    <p className="text-sm text-primary font-medium">{anomaly.suggestedAction}</p>
                </div>
                 {anomaly.relatedIds && anomaly.relatedIds.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm">Related IDs</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {anomaly.relatedIds.map(id => (
                                <Badge key={id} variant="outline" className="font-mono">{id}</Badge>
                            ))}
                        </div>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
