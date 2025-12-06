'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { User } from 'firebase/auth';
import { guestInfoSchema, type GuestInfoData } from '@/lib/validation/guest-info-schema';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight, UserCircle2, UploadCloud, Camera, Check, CircleUserRound, ShieldCheck, Send, MapPin } from 'lucide-react';
import { GradientTitle } from '@/components/ui/gradient-title';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { documentTypes, countries } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CheckIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface GuestInfoStepProps {
  user: User | null | undefined;
  onSubmit: (data: GuestInfoData) => void;
  isSubmitting: boolean;
}

export function GuestInfoStep({ user, onSubmit, isSubmitting }: GuestInfoStepProps) {
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieStream, setSelfieStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const form = useForm<GuestInfoData>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      guestName: '', guestEmail: '', guestPhone: '', country: '',
      documentType: 'Passport', documentNumber: '', documentImage: '', selfieImage: '',
      adults: searchParams.get('adults') || '1',
      children: searchParams.get('children') || '0',
      numberOfRooms: searchParams.get('rooms') || '1',
    },
  });

  useEffect(() => {
    if (user) {
        form.reset({
            guestName: user.displayName || '', 
            guestEmail: user.email || '', 
            guestPhone: user.phoneNumber || '', 
            country: '',
            documentType: 'Passport', 
            documentNumber: '', 
            documentImage: '', 
            selfieImage: '',
            adults: searchParams.get('adults') || '1',
            children: searchParams.get('children') || '0',
            numberOfRooms: searchParams.get('rooms') || '1',
        })
    }
  }, [user, form, searchParams]);
  
  const stopCamera = useCallback(() => {
    if (selfieStream) {
      selfieStream.getTracks().forEach(track => track.stop());
      setSelfieStream(null);
    }
  }, [selfieStream]);


  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setSelfieStream(stream);
      setHasCameraPermission(true);
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions in your browser settings.'});
    }
  };

  useEffect(() => {
    // This effect ensures the video stream is attached correctly when the component updates.
    if (selfieStream && selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = selfieStream;
    }
  }, [selfieStream]);
  
  const takeSelfie = () => {
    if (!selfieVideoRef.current) return;
    const video = selfieVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');
    setSelfiePreview(dataUri);
    form.setValue('selfieImage', dataUri, { shouldValidate: true });
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setIdPreview(dataUri);
        form.setValue('documentImage', dataUri, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountrySelect = (countryValue: string) => {
    form.setValue("country", countryValue, { shouldValidate: true });
    setCountryPopoverOpen(false);
  };

  return (
    <>
      <div className="mb-6 space-y-1">
        <GradientTitle as="h2" className="text-3xl">Guest & Verification Details</GradientTitle>
        <p className="text-muted-foreground flex items-center gap-2">
          <UserCircle2 className="h-5 w-5" />
          Confirm your details and complete the identity verification.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <input type="hidden" {...form.register('adults')} />
          <input type="hidden" {...form.register('children')} />
          <input type="hidden" {...form.register('numberOfRooms')} />

          <FormField control={form.control} name="guestName" render={({ field }) => (
            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <div className="grid md:grid-cols-2 gap-6">
            <FormField control={form.control} name="guestEmail" render={({ field }) => (
              <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="guestPhone" render={({ field }) => (
              <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="(123) 456-7890" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
          <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Country of Residence</FormLabel>
                  <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? countries.find(
                                (country) => country.value === field.value
                              )?.label
                            : "Select country"}
                          <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Search country..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No country found.</CommandEmpty>
                                <CommandGroup>
                                {countries.map((country) => (
                                    <CommandItem
                                    value={country.label}
                                    key={country.value}
                                    onSelect={() => handleCountrySelect(country.value)}
                                    className="cursor-pointer"
                                    >
                                    {country.label}
                                    <CheckIcon
                                        className={cn(
                                        "ml-auto h-4 w-4",
                                        country.value === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                    />
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          
          <div className="grid gap-6 md:grid-cols-2">
            <FormField control={form.control} name="documentType" render={({ field }) => (
              <FormItem>
                <FormLabel>ID Document Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger></FormControl>
                  <SelectContent>{documentTypes.map(dt => (<SelectItem key={dt} value={dt}>{dt}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="documentNumber" render={({ field }) => (
              <FormItem><FormLabel>Document Number</FormLabel><FormControl><Input {...field} placeholder="A12345678" /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
          
          <FormField control={form.control} name="documentImage" render={() => (
            <FormItem>
              <FormLabel>Upload ID Document</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type="file" id="document-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="document-upload" className={cn("flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer", "hover:border-primary hover:bg-primary/5 transition-colors")}>
                    {idPreview ? (<Image src={idPreview} alt="ID Preview" fill style={{ objectFit: 'contain' }} className="rounded-md"/>) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                        <UploadCloud className="w-8 h-8 mb-2" /><p className="mb-2 text-sm">Click to upload ID</p>
                      </div>)}
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>

          <FormField control={form.control} name="selfieImage" render={() => (
            <FormItem>
                <FormLabel>Live Selfie Verification</FormLabel>
                <div className="w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                    {/* The video element is now always rendered */}
                    <video 
                        ref={selfieVideoRef} 
                        className={cn("w-full h-full object-cover", { 'hidden': !selfieStream })} 
                        autoPlay 
                        muted 
                        playsInline 
                    />
                    
                    {selfiePreview && (
                        <Image src={selfiePreview} alt="Selfie Preview" layout="fill" className="object-cover" />
                    )}
                    
                    {!selfieStream && !selfiePreview && (
                        <div className="text-center text-muted-foreground">
                            <CircleUserRound className="h-16 w-16 mx-auto" />
                            <p>Camera is off</p>
                        </div>
                    )}
                </div>
              {!selfieStream && !selfiePreview && (
                <Button type="button" onClick={startCamera} className="w-full mt-2"><Camera className="mr-2 h-4 w-4"/>Start Camera for Selfie</Button>
              )}
              {selfieStream && (<Button type="button" onClick={takeSelfie} className="w-full mt-2"><Check className="mr-2 h-4 w-4"/>Take Selfie</Button>)}
              {hasCameraPermission === false && (<Alert variant="destructive" className="mt-2"><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please allow camera access in your browser settings to continue.</AlertDescription></Alert>)}
              <FormMessage />
            </FormItem>
          )}/>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>) : (<><ShieldCheck className="mr-2 h-4 w-4" /> Verify & Continue</>)}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
