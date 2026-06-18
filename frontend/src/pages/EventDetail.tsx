import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Info, Armchair, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface EventDetailProps {
  eventId: string;
  onNavigateBack: () => void;
  onReservationCreated: (reservation: any) => void;
  onRequireAuth: (destination: string) => void;
}

interface SeatData {
  _id: string;
  seatNumber: string;
  status: 'available' | 'reserved' | 'booked';
}

export const EventDetail: React.FC<EventDetailProps> = ({
  eventId,
  onNavigateBack,
  onReservationCreated,
  onRequireAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reserveLoading, setReserveLoading] = useState<boolean>(false);
  const [alreadyBooked, setAlreadyBooked] = useState<boolean>(false);

  const fetchSeatsData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await API.get(`/events/${eventId}`);
      setEventDetails(response.data.event);
      setSeats(response.data.seats);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to fetch seating arrangements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatsData();
  }, [eventId]);

  const handleSeatClick = (seat: SeatData) => {
    if (seat.status !== 'available' || alreadyBooked) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      } else {
        return [...prev, seat.seatNumber];
      }
    });
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) return;

    if (!isAuthenticated) {
      onRequireAuth('event-detail');
      return;
    }

    setReserveLoading(true);
    setErrorMsg(null);
    try {
      const response = await API.post('/reserve', {
        eventId,
        seatNumbers: selectedSeats,
      });
      onReservationCreated(response.data.reservation);
    } catch (err: any) {
      if (err.response?.data?.alreadyBooked) {
        setAlreadyBooked(true);
      } else {
        const apiErr = err.response?.data?.error || 'Failed to place reservation.';
        setErrorMsg(apiErr);
        fetchSeatsData();
      }
    } finally {
      setReserveLoading(false);
    }
  };

  // Group seats by their Row letter (e.g., 'A' from 'A3')
  const getGroupedSeats = () => {
    const groups: Record<string, SeatData[]> = {};
    seats.forEach((seat) => {
      const rowLetter = seat.seatNumber.charAt(0) || 'Generic';
      if (!groups[rowLetter]) {
        groups[rowLetter] = [];
      }
      groups[rowLetter].push(seat);
    });

    // Sort rows alphabetically and sort seats inside each row numerical order
    const sortedKeys = Object.keys(groups).sort();
    const result: { rowName: string; seatsList: SeatData[] }[] = [];

    sortedKeys.forEach((key) => {
      const seatsList = groups[key].sort((a, b) => {
        const numA = parseInt(a.seatNumber.slice(1)) || 0;
        const numB = parseInt(b.seatNumber.slice(1)) || 0;
        return numA - numB;
      });
      result.push({ rowName: key, seatsList });
    });

    return result;
  };

  if (loading && !eventDetails) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-500 font-semibold text-sm">Organizing auditorium seating layouts...</p>
      </div>
    );
  }

  const groupedRows = getGroupedSeats();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigate Back header */}
      <button
        onClick={onNavigateBack}
        className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Main Grid Card details */}
      {eventDetails && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 md:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                {eventDetails.name}
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                📍 {eventDetails.venue} • {new Date(eventDetails.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={fetchSeatsData}
              className="text-gray-400 hover:text-slate-700 bg-slate-50 border border-slate-100 hover:bg-slate-100 p-2 rounded-xl transition-all self-start cursor-pointer"
              title="Refresh seats status"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Already booked banner */}
      {alreadyBooked && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-semibold flex gap-3 items-start shadow-xs">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p>You've already booked this event — duplicate bookings aren't allowed.</p>
            <button
              onClick={onNavigateBack}
              className="mt-2 text-indigo-600 underline font-bold cursor-pointer"
            >
              Browse other events
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex gap-3 items-start shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Interactive Auditorium Board */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 p-6 md:p-8 shadow-sm flex flex-col items-center">

          {/* Stage presentation */}
          <div className="w-full max-w-[280px] bg-indigo-50 border-t-4 border-indigo-600 py-2.5 rounded-b-xl text-center mb-12">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest leading-none">STAGE</span>
          </div>

          {/* Grid render */}
          <div className="w-full space-y-4">
            {groupedRows.map((row) => (
              <div key={row.rowName} className="flex gap-2 justify-center items-center">
                {/* Row label */}
                <span className="w-5 text-xs font-bold text-slate-400 text-center select-none mr-1">
                  {row.rowName}
                </span>

                {/* Individual seats render */}
                <div className="flex gap-2 sm:gap-3.5">
                  {row.seatsList.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber);

                    // Determine styling color classes
                    let colorClasses = 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100 cursor-pointer';
                    if (seat.status === 'booked') {
                      colorClasses = 'bg-red-50 border-red-150 text-red-400 cursor-not-allowed';
                    } else if (seat.status === 'reserved') {
                      colorClasses = 'bg-amber-50 border-amber-200 text-amber-500 cursor-not-allowed';
                    }
                    if (isSelected) {
                      colorClasses = 'bg-indigo-600 border-indigo-750 text-white shadow-md ring-2 ring-indigo-500/30 scale-105 cursor-pointer';
                    }

                    return (
                      <button
                        key={seat._id}
                        disabled={seat.status !== 'available' || alreadyBooked}
                        onClick={() => handleSeatClick(seat)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm font-bold border rounded-lg flex items-center justify-center transition-all ${colorClasses}`}
                        title={`Seat ${seat.seatNumber} (${seat.status})`}
                      >
                        {seat.seatNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Color Key Guide */}
          <div className="flex gap-6 mt-12 pt-6 border-t border-gray-100 w-full justify-center text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 bg-emerald-50 border border-emerald-250 rounded-sm inline-block"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 bg-amber-50 border border-amber-250 rounded-sm inline-block"></span>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 bg-red-50 border border-red-150 rounded-sm inline-block"></span>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 bg-indigo-600 border border-indigo-700 rounded-sm inline-block"></span>
              <span>Your Pick</span>
            </div>
          </div>

        </div>

        {/* Selected Summary Sidebar */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between h-fit gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight border-b border-gray-100 pb-3">Seating Summary</h3>

            {selectedSeats.length === 0 ? (
              <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Armchair className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                <p className="text-xs font-medium">Click on seats to include them in booking hold list</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat}
                      className="px-3 py-1 font-mono font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg text-sm flex items-center gap-1.5 animate-bounce-short"
                    >
                      Seat {seat}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 border-t border-gray-50 pt-3">
                  <span>Selected Units:</span>
                  <span className="text-gray-900 font-extrabold">{selectedSeats.length} ticket(s)</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            {/* Disclaimer */}
            <div className="flex gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-100 mb-4 font-medium">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Holding seats reserves them atomically for 10 minutes. Complete the booking before the timer is gone.</span>
            </div>

            <button
              onClick={handleReserve}
              disabled={selectedSeats.length === 0 || reserveLoading || alreadyBooked}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-center shadow-xs transition-colors cursor-pointer"
            >
              {reserveLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Securing seats...</span>
                </span>
              ) : (
                <span>{isAuthenticated ? 'Place Ticket Hold' : 'Sign In to reserve'}</span>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EventDetail;