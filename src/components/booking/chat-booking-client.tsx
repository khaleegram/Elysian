'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Bot, User, ArrowRight, Camera, UploadCloud, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { bookingAgentAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatBookingClient() {
  const { toast } = useToast();
  const user = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [requires, setRequires] = useState<'documentImage' | 'selfieImage' | 'nothing' | null>(null);

  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div');
            if(viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, 100);
  }, []);

  const callBookingAgent = useCallback(async (userMessage?: string, docImage?: string, selfImage?: string) => {
    if (!user) return;

    setIsLoading(true);
    setRequires(null);
    stopCamera();

    try {
      const result = await bookingAgentAction(user.uid, userMessage, docImage, selfImage);
      if (result.error) throw new Error(result.errorMessage);
      
      const newMessages: Message[] = [];
      if(result.response) {
        newMessages.push({role: 'assistant', content: result.response});
      }

      setMessages(prev => [...(result.history || prev), ...newMessages]);

      if (result.bookingId) setBookingId(result.bookingId);
      if (result.requires) setRequires(result.requires as any);
      
    } catch (error) {
      console.error('bookingAgentAction error', error);
      const message = error instanceof Error ? error.message : "Failed to contact booking service.";
      setMessages(prev => [...(prev || []), { role: 'assistant', content: `I'm having trouble connecting right now. Please try again. \n\n**Error:** ${message}` }]);
      toast({ variant: 'destructive', title: 'Network Error', description: message });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [user, toast, scrollToBottom]);

  // Initial load
  useEffect(() => {
    if (user === null) {
      router.push('/login?redirect=/chat');
      setIsLoading(false);
    } else if (user) {
      // Call with no prompt to get initial greeting
      callBookingAgent(); 
    }
  }, [user, router]); // `callBookingAgent` removed to prevent re-triggering

  useEffect(scrollToBottom, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user' as const, content: currentInput }]);
    setInput('');
    await callBookingAgent(currentInput);
  };
  
  // --- Camera and Image Upload Handlers ---

  const stopCamera = useCallback(() => {
    if (selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
      setSelfieStream(null);
    }
  }, [selfieStream]);

  const handleStartCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setSelfieStream(stream);
      if (selfieVideoRef.current) selfieVideoRef.current.srcObject = stream;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Camera Access Denied' });
    }
  };
  
  const handleTakeSelfie = () => {
    if (!selfieVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = selfieVideoRef.current.videoWidth;
    canvas.height = selfieVideoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(selfieVideoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setMessages(prev => [...prev, { role: 'user', content: `<img src="${dataUri}" alt="selfie" class="rounded-lg w-40"/>` }]);
    callBookingAgent(undefined, undefined, dataUri);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setMessages(prev => [...prev, { role: 'user', content: `<img src="${dataUri}" alt="document" class="rounded-lg w-40"/>` }]);
        callBookingAgent(undefined, dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto shadow-2xl"><CardContent className="p-4 h-[30rem] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent></Card>
    );
  }

  const renderActionUI = () => {
    if (requires === 'documentImage') {
      return (
        <Alert>
          <UploadCloud className="h-4 w-4" />
          <AlertTitle>Upload your ID</AlertTitle>
          <AlertDescription>The AI assistant has requested your ID document. Please upload an image.</AlertDescription>
           <Button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full">
            <UploadCloud className="mr-2 h-4 w-4"/> Select Image
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
        </Alert>
      );
    }
    if (requires === 'selfieImage') {
      return (
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertTitle>Take a Selfie</AlertTitle>
          <AlertDescription>Please take a live selfie for verification.</AlertDescription>
          <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative my-2">
            <video ref={selfieVideoRef} className={cn("w-full h-full object-cover", !selfieStream && "hidden")} autoPlay muted playsInline />
            {!selfieStream && <User className="h-16 w-16 text-muted-foreground"/>}
          </div>
          {selfieStream ? (
            <Button onClick={handleTakeSelfie} className="w-full"><Check className="mr-2 h-4 w-4"/>Take Picture</Button>
          ) : (
            <Button onClick={handleStartCamera} className="w-full"><Camera className="mr-2 h-4 w-4"/>Start Camera</Button>
          )}
        </Alert>
      );
    }
    return null;
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-2xl">
      <CardContent className="p-4">
        <ScrollArea className="h-96 w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (<Avatar className="w-8 h-8 bg-primary text-primary-foreground"><AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback></Avatar>)}
                <div className={cn('max-w-sm rounded-lg px-4 py-2 relative group', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                </div>
                {message.role === 'user' && (<Avatar className="w-8 h-8"><AvatarFallback><User className="w-5 h-5" /></AvatarFallback></Avatar>)}
              </div>
            ))}

            {isLoading && messages.length > 0 && (<div className="flex items-start gap-3 justify-start">
              <Avatar className="w-8 h-8 bg-primary text-primary-foreground"><AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback></Avatar>
              <div className="bg-muted rounded-lg px-4 py-3"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            </div>)}

            {renderActionUI()}

            {bookingId && (
              <div className="flex justify-center p-4">
                <Button asChild>
                  <Link href={`/booking/${bookingId}/status`}>View Your Booking Status <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g., 'Book a suite for this weekend'" className="flex-1" disabled={isLoading || !user || !!bookingId || !!requires} />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !user || !!bookingId || !!requires}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}