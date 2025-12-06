import { Room, RoomStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BedDouble, Check, Wrench, Sparkles } from 'lucide-react';

const statusStyles: Record<RoomStatus, { icon: React.ElementType, className: string, label: string }> = {
  Available: { icon: Check, className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', label: 'Available' },
  Occupied: { icon: BedDouble, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', label: 'Occupied' },
  Dirty: { icon: Sparkles, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', label: 'Needs Cleaning' },
  Maintenance: { icon: Wrench, className: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Maintenance' },
};

export function RoomStatusGrid({ rooms }: { rooms: Room[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Room Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {rooms.map(room => {
            const style = statusStyles[room.status];
            const Icon = style.icon;
            return (
              <div key={room.id} className={`p-4 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-300 ${style.className}`}>
                <Icon className="h-6 w-6 mb-2" />
                <p className="font-bold text-lg">{room.number}</p>
                <p className="text-xs font-medium opacity-80">{room.type}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
