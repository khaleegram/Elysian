
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRoomAction, updateRoomAction } from '@/app/actions';
import { RoomType, Room, RoomStatus, RoomImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormState } from 'react-dom';
import { useTransition } from 'react';

const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required.'),
  type: z.nativeEnum(RoomType),
  price: z.coerce.number().min(1, 'Price must be greater than 0.'),
  status: z.nativeEnum(RoomStatus),
  images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface AddRoomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room;
}

export function AddRoomDialog({ isOpen, onOpenChange, room }: AddRoomDialogProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!room;
  const [isPending, startTransition] = useTransition();

  const action = isEditMode ? updateRoomAction.bind(null, room.id) : createRoomAction;
  const [state, formAction] = useFormState(action, { success: false, message: '' });

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: '',
      type: RoomType.Standard,
      price: 100,
      status: RoomStatus.Available,
      images: [],
    },
  });

  const { fields, remove, replace } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (room && isOpen) {
      form.reset({
        ...room,
        images: room.images || [],
      });
      replace(room.images || []);
    } else if (!isOpen) {
      form.reset();
      replace([]);
      setNewImageFiles([]);
    }
  }, [room, isOpen, form, replace]);

  useEffect(() => {
    if (state.success) {
      toast({ title: 'Success!', description: state.message });
      onOpenChange(false);
    } else if (state.message && !state.success) { // only show toast on error message
      toast({ variant: 'destructive', title: 'Error', description: state.message });
    }
  }, [state, toast, onOpenChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewImageFiles(Array.from(event.target.files));
    }
  };
  
  const handleAction = (formData: FormData) => {
    startTransition(() => {
      // Append existing images JSON
      formData.append('existingImages', JSON.stringify(fields));

      // Append new files with unique keys
      newImageFiles.forEach((file, index) => {
          formData.append(`new-images-${index}`, file);
      });
      formAction(formData);
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Update the details for room ${room.number}.` : "Enter the details for the new room."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} action={handleAction} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 101, 205A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                    <FormLabel>Room Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a room type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {Object.values(RoomType).map((type) => (
                            <SelectItem key={type} value={type}>
                            {type}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a room status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {Object.values(RoomStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                            {status}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                    <FormLabel>Price per night ($)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="150" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormItem>
                <FormLabel>Room Images</FormLabel>
                <FormControl>
                    <Input
                        type="file"
                        id="room-image-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />
                </FormControl>
                <label 
                    htmlFor="room-image-upload" 
                    className={cn(
                        "flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md cursor-pointer transition-colors",
                        "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                    )}
                >
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <UploadCloud className="w-5 h-5" />
                        <span>{newImageFiles.length > 0 ? `${newImageFiles.length} file(s) selected` : 'Click to upload images'}</span>
                    </div>
                </label>
            </FormItem>

            {fields.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative group">
                            <Image
                                src={field.url}
                                alt={`Room image ${index + 1}`}
                                width={100}
                                height={100}
                                className="rounded-md object-cover w-full aspect-square"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => remove(index)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEditMode ? 'Save Changes' : 'Save Room'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
