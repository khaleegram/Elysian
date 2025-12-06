
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth, useFirestore } from "@/firebase"
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { doc, setDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react";

const signUpSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

const signInSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z.string().min(1, { message: "Password is required." }),
})

export function AuthForm() {
    const [activeTab, setActiveTab] = useState("sign-in");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const signInForm = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    });

    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: "", email: "", password: "" },
    });
    
    // Creates the session cookie and then redirects.
    const createSessionAndRedirect = async (user: any) => {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (!res.ok) {
            toast({ variant: "destructive", title: "Authentication Error", description: "Could not create a server session." });
            setIsLoading(false);
            setIsGoogleLoading(false);
            return;
        }

        const idTokenResult = await user.getIdTokenResult(true);
        if (idTokenResult.claims.role === 'admin') {
            router.push('/admin/dashboard');
        } else if (idTokenResult.claims.role === 'staff') {
            router.push('/staff/dashboard');
        }
        else {
            router.push('/');
        }
    };


    const handleGoogleSignIn = async () => {
        if (!auth || !firestore) return;
        setIsGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            const guestData = {
                name: user.displayName,
                email: user.email,
                phone: user.phoneNumber || '',
            };

            const guestRef = doc(firestore, "guests", user.uid);
            await setDoc(guestRef, guestData, { merge: true });

            toast({ title: "Successfully signed in with Google!" });
            await createSessionAndRedirect(user);

        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            toast({ variant: "destructive", title: "Authentication Error", description: error.message });
        } finally {
            setIsGoogleLoading(false);
        }
    };


    async function onSignIn(values: z.infer<typeof signInSchema>) {
        if (!auth) return;
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: "Sign in successful!", description: "Welcome back." });
            await createSessionAndRedirect(userCredential.user);
        } catch (error: any) {
            console.error("Sign In Error:", error);
            toast({ variant: "destructive", title: "Sign In Failed", description: "Invalid email or password. Please try again." });
            setIsLoading(false);
        }
    }

    async function onSignUp(values: z.infer<typeof signUpSchema>) {
        if (!auth || !firestore) return;
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            
            const guestData = {
                name: values.name,
                email: values.email,
                phone: '',
                bookingHistory: [],
            };

            const guestRef = doc(firestore, "guests", user.uid);
            await setDoc(guestRef, guestData);

            toast({ title: "Account created!", description: "You have been successfully signed up." });
            await createSessionAndRedirect(user);
            
        } catch (error: any) {
            console.error("Sign Up Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast({ variant: "destructive", title: "Sign Up Failed", description: "An account with this email already exists." });
            } else {
                toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
            }
            setIsLoading(false);
        }
    }
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="sign-in">
                <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4 pt-4">
                        <FormField
                            control={signInForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} disabled={isLoading || isGoogleLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="sign-up">
                <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4 pt-4">
                         <FormField
                            control={signUpForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} disabled={isLoading || isGoogleLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="you@example.com" {...field} disabled={isLoading || isGoogleLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} disabled={isLoading || isGoogleLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                </Form>
            </TabsContent>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.31-11.28-7.94l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.45 44 30.884 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>}
                Google
            </Button>
        </Tabs>
    );
}
