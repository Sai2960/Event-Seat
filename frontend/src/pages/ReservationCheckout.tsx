import React, { useState } from 'react';
import API from '../api/api';
import { CountdownTimer } from '../components/CountdownTimer';
import { CheckCircle2, AlertCircle, ShoppingCart, Info, Ticket, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

interface ReservationCheckoutProps {
  reservation: any;
  onNavigateHome: () => void;
  onBackToSeating: () => void;
}

export const ReservationCheckout: React.FC<ReservationCheckoutProps> = ({
  reservation,
  onNavigateHome,
  onBackToSeating,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [bookingReceipt, setBookingReceipt] = useState<any>(null);

  const handleConfirm = async () => {
    if (isExpired || isConfirmed) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await API.post('/bookings', {
        reservationId: reservation._id,
      });
      
      setBookingReceipt(response.data.booking);
      setIsConfirmed(true);
    } catch (err: any) {
      console.error(err);
      const errStr = err.response?.data?.error || 'Failed to complete booking. Stale hold or network error.';
      setErrorMsg(errStr);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerExpire = () => {
    setIsExpired(true);
    setErrorMsg('Your 10-minutes reservation window has expired. Your seat holdings have been released.');
  };

  // Success Layout
  if (isConfirmed && bookingReceipt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-gray-150 shadow-md p-8 text-center flex flex-col items-center">
          
          <div className="inline-flex p-4.5 bg-emerald-50 text-emerald-600 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 font-semibold text-sm mb-8">Your event seats are successfully secured.</p>

          {/* Ticket receipt */}
          <div className="w-full text-left bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden mb-8 shadow-inner">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Ticket className="w-4.5 h-4.5" />
                <span className="font-bold text-sm tracking-widest uppercase">OFFICIAL TICKET RESUMES</span>
              </div>
              <span className="text-xs font-mono font-medium opacity-80">Ref: #{bookingReceipt.id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="p-6 space-y-4 text-sm font-medium">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Reserved Seats</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {bookingReceipt.seatNumbers.map((seat: string) => (
                    <span key={seat} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100 font-mono">
                      Seat {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">CONFIRMED AT</span>
                  <p className="text-slate-800 font-semibold">{new Date(bookingReceipt.confirmedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ADMISSION</span>
                  <p className="text-slate-800 font-semibold">Standard Pass</p>
                </div>
              </div>
            </div>

            {/* Simulated bar codings bar-code */}
            <div className="bg-slate-100 px-6 py-4 flex flex-col items-center">
              <div className="w-full h-8 bg-slate-800 flex items-center justify-between px-1 select-none opacity-40">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full bg-black`}
                    style={{ width: `${Math.random() > 0.4 ? '2px' : '4px'}` }}
                  ></div>
                ))}
              </div>
              <span className="font-mono text-xxs text-slate-400 tracking-widest mt-1.5 uppercase">VERIFIED BY EVENTSEAT NETWORK</span>
            </div>
          </div>

          <button
            onClick={onNavigateHome}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center shadow-xs transition-colors cursor-pointer"
          >
            Back to Browse Events
          </button>
        </div>
      </div>
    );
  }

  // Active / Expired Checkout panel
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      
      {/* Navigate Back header if not expired */}
      {!isExpired && (
        <button
          onClick={onBackToSeating}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seating Map</span>
        </button>
      )}

      <div className="bg-white rounded-2xl border border-gray-150 p-6 md:p-8 shadow-sm">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
              <ShoppingCart className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Review Reservation holds</h2>
              <p className="text-xs text-gray-400 font-medium">Please review and lock in your tickets</p>
            </div>
          </div>

          {/* Countdown live clock */}
          {!isConfirmed && (
            <CountdownTimer
              expiresAt={reservation.expiresAt}
              onExpire={handleTimerExpire}
            />
          )}
        </div>

        {/* Display holds errors */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex gap-2.5 items-start shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Reservation Alert</p>
              <p className="text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Details and review items */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Order Details</h3>
            <div className="space-y-2.5 font-medium text-sm text-slate-650">
              <div className="flex justify-between">
                <span className="text-slate-500">Holder Name:</span>
                <span className="font-bold text-slate-800">Event Ticket Pass</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seating Numbers:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {reservation.seatNumbers.map((seat: string) => (
                    <span key={seat} className="px-2 py-0.5 font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-md">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Checkout Price:</span>
                <span className="text-indigo-600 font-extrabold text-base">FREE / DEMO</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 text-xs text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100 font-medium">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
            <span>This is a free booking mock layout checkpoint. EventSeat requires no real financial transactions. Pressing Confirm completes booking immediately.</span>
          </div>

          {/* Dynamic confirmatons controls */}
          {isExpired ? (
            <div className="space-y-4">
              <button
                disabled
                className="w-full py-3 bg-gray-200 text-gray-400 font-semibold rounded-xl text-center cursor-not-allowed border border-gray-300"
              >
                Reservation Expired
              </button>
              <button
                onClick={onBackToSeating}
                className="w-full flex items-center justify-center gap-1.5 py-3 border border-indigo-600 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-xl transition-all cursor-pointer"
              >
                <span>Navigate back to Seat grid map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading || isExpired}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-center shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing tickets...</span>
                </span>
              ) : (
                <>
                  <span>Confirm Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
export default ReservationCheckout;
