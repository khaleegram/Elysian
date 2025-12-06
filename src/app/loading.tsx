import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
