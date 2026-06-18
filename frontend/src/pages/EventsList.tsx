import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { EventCard, EventData } from '../components/EventCard';
import { RefreshCw, Search, Sparkles, SlidersHorizontal, Armchair } from 'lucide-react';

interface EventsListProps {
  onSelectEvent: (eventId: string) => void;
}

export const EventsList: React.FC<EventsListProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchEvents = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await API.get('/events');
      setEvents(response.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to retrieve events list. Please examine connection states.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events based on search query
  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Editorial Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">
          Lock in Your <span className="text-indigo-600">Event seats</span> Spot
        </h1>
        <p className="text-gray-500 font-medium sm:text-lg">
          Experience seamless ticket reservations, active seat maps, and atomic concurrency lockouts.
        </p>
      </div>

      {/* Control Actions (Search & Refresh) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 border border-gray-150 rounded-2xl shadow-xs mb-8">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search events or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10.5 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium"
          />
        </div>
        
        <div className="flex gap-2.5 items-center justify-end w-full sm:w-auto">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        // Skeleton loader grids
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-xs animate-pulse">
              <div className="h-6 w-1/3 bg-slate-100 rounded-lg"></div>
              <div className="h-8 w-3/4 bg-slate-150 rounded-lg"></div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-slate-100 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded-md"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded-md"></div>
              </div>
              <div className="h-12 w-full bg-slate-100 rounded-xl pt-4"></div>
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        // Error presentation
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <h3 className="text-lg font-bold text-red-800 mb-2">Sync Connection Error</h3>
          <p className="text-red-700 text-sm mb-5 font-medium">{errorMsg}</p>
          <button
            onClick={fetchEvents}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        // Empty states representation
        <div className="bg-slate-50 border border-dashed border-gray-250 rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="inline-flex p-4 bg-slate-100 text-slate-500 rounded-full mb-4">
            <Armchair className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Events Found</h3>
          <p className="text-slate-500 text-sm mb-4">There are no matching events open for reservation right now.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // Render Cards Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div key={event._id}>
              <EventCard event={event} onSelect={onSelectEvent} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
export default EventsList;
