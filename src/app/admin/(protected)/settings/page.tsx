
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GradientTitle } from "@/components/ui/gradient-title";
import { Building, CreditCard, Bot } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <header className="mb-8">
                <GradientTitle>Settings</GradientTitle>
                <p className="mt-2 text-lg text-muted-foreground">Configure hotel information, payment settings, and system preferences.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Hotel Information</CardTitle>
                        <CardDescription>Update your hotel's public details and branding.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hotel-name">Hotel Name</Label>
                            <Input id="hotel-name" defaultValue="ElysianAI Hotel" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hotel-contact">Contact Email</Label>
                            <Input id="hotel-contact" type="email" defaultValue="contact@elysianai.com" />
                        </div>
                         <Button className="w-full">Save Hotel Info</Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Gateway</CardTitle>
                        <CardDescription>Manage your Paystack integration keys.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="paystack-pk">Paystack Public Key</Label>
                            <Input id="paystack-pk" type="password" defaultValue="pk_test_xxxxxxxxxxxxxx" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paystack-sk">Paystack Secret Key</Label>
                            <Input id="paystack-sk" type="password" defaultValue="sk_test_xxxxxxxxxxxxxx" />
                        </div>
                        <Button className="w-full">Save API Keys</Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> AI Configuration</CardTitle>
                        <CardDescription>Adjust thresholds for AI-driven features.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="fraud-threshold">Fraud Review Threshold</Label>
                            <Input id="fraud-threshold" type="number" defaultValue="40" />
                            <p className="text-xs text-muted-foreground">Bookings with a score above this will be flagged for review.</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="fraud-decline">Fraud Decline Threshold</Label>
                            <Input id="fraud-decline" type="number" defaultValue="70" />
                              <p className="text-xs text-muted-foreground">Bookings with a score above this will be automatically declined.</p>
                        </div>
                        <Button className="w-full">Save AI Settings</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
