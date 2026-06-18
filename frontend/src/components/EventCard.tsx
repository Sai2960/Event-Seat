import React from 'react';
import { Calendar, MapPin, Armchair, Ticket } from 'lucide-react';

export interface EventData {
  _id: string;
  name: string;
  dateTime: string;
  venue: string;
  totalSeats: number;
}

interface EventCardProps {
  event: EventData;
  onSelect: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  // Format dateTime nicely
  const formatDate = (dateStr: string) => {
    try {
      const dateOption: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      const timeOption: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      const dateObj = new Date(dateStr);
      return `${dateObj.toLocaleDateString('en-US', dateOption)} at ${dateObj.toLocaleTimeString('en-US', timeOption)}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden flex flex-col justify-between h-full">
      <div className="p-6">
        {/* Ribbon decoration */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Ticket className="w-3.5 h-3.5" />
            <span>LIVE BOOKING</span>
          </span>
        </div>

        {/* Event Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 tracking-tight">
          {event.name}
        </h3>

        {/* Details list */}
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 text-sm text-gray-650">
            <Calendar className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <span className="font-medium text-gray-600">{formatDate(event.dateTime)}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-650">
            <MapPin className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <span className="text-gray-600 line-clamp-1">{event.venue}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-650">
            <Armchair className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <span className="text-gray-600">Capacity: {event.totalSeats} seats</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button
          onClick={() => onSelect(event._id)}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Select Seats</span>
        </button>
      </div>
    </div>
  );
};
export default EventCard;
