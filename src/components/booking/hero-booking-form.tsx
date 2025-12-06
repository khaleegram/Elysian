
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { bookingAgentAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { RoomType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2, MessageCircle, Search, Users, Minus, Plus, Send } from 'lucide-react';
import { useState } from 'react';

const searchSchema = z.object({
  checkIn: z.date({ required_error: 'Check-in date is required.' }),
  checkOut: z.date({ required_error: 'Check-out date is required.' }),
  roomType: z.nativeEnum(RoomType),
  adults: z.coerce.number().min(1, 'At least one adult is required.'),
  children: z.coerce.number().min(0),
  rooms: z.coerce.number().min(1, 'At least one room is required.'),
}).refine(data => data.checkOut > data.checkIn, {
  message: 'Check-out date must be after check-in date.',
  path: ['checkOut'],
});


export function HeroBookingForm() {
  const router = useRouter();
  
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      checkIn: new Date(),
      checkOut: addDays(new Date(), 1),
      roomType: RoomType.Standard,
      adults: 2,
      children: 0,
      rooms: 1,
    },
  });

  const onSearchSubmit = (values: z.infer<typeof searchSchema>) => {
    const params = new URLSearchParams({
      checkIn: format(values.checkIn, 'yyyy-MM-dd'),
      checkOut: format(values.checkOut, 'yyyy-MM-dd'),
      roomType: values.roomType,
      adults: values.adults.toString(),
      children: values.children.toString(),
      rooms: values.rooms.toString(),
    });
    router.push(`/booking/search?${params.toString()}`);
  };

  const onChatClick = () => {
    router.push('/chat');
  };


  const adults = searchForm.watch('adults');
  const children = searchForm.watch('children');

  return (
    <Tabs defaultValue="search" className="h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">
          <Search className="mr-2 h-4 w-4" /> Traditional Search
        </TabsTrigger>
        <TabsTrigger value="chat" onClick={onChatClick}>
          <MessageCircle className="mr-2 h-4 w-4" /> Book with AI
        </TabsTrigger>
      </TabsList>
      <TabsContent value="search" className="h-full">
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(onSearchSubmit)} className="grid grid-cols-1 items-end gap-2 md:grid-cols-5 p-2 h-full">
            <FormField
              control={searchForm.control}
              name="checkIn"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-xs font-semibold text-gray-500">Check in</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full justify-start text-left font-normal h-10', !field.value && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={searchForm.control}
              name="checkOut"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-xs font-semibold text-gray-500">Check out</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full justify-start text-left font-normal h-10', !field.value && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= (searchForm.getValues('checkIn') || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />

            <FormItem className="md:col-span-1">
              <FormLabel className="text-xs font-semibold text-gray-500">Guests</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{adults} Adults, {children} Children</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <FormLabel>Adults</FormLabel>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => searchForm.setValue('adults', Math.max(1, adults - 1))} type="button"><Minus className="h-4 w-4" /></Button>
                                <span>{adults}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => searchForm.setValue('adults', adults + 1)} type="button"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                         <div className="flex items-center justify-between">
                            <FormLabel>Children</FormLabel>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => searchForm.setValue('children', Math.max(0, children - 1))} type="button"><Minus className="h-4 w-4" /></Button>
                                <span>{children}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => searchForm.setValue('children', children + 1)} type="button"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
            </FormItem>

            <FormField
              control={searchForm.control}
              name="roomType"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-xs font-semibold text-gray-500">Room Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(RoomType).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-10 md:col-span-1">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="chat">
        {/* Content for AI chat is handled by redirecting */}
      </TabsContent>
    </Tabs>
  );
}
