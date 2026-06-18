import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../frontend/src/context/AuthContext';
import { Navbar } from '../frontend/src/components/Navbar';
import { EventsList } from '../frontend/src/pages/EventsList';
import { Login } from '../frontend/src/pages/Login';
import { Signup } from '../frontend/src/pages/Signup';
import { EventDetail } from '../frontend/src/pages/EventDetail';
import { ReservationCheckout } from '../frontend/src/pages/ReservationCheckout';

/**
 * Inner router component that consumes the global active Auth Context.
 */
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();
  
  // State-driven routing structure (Events List, Login Form, Register Form, Seat Select coordinates grids, Checkout)
  const [page, setPage] = useState<string>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeReservation, setActiveReservation] = useState<any | null>(null);
  const [onSuccessDestination, setOnSuccessDestination] = useState<string | undefined>(undefined);

  const handleNavigation = (view: string) => {
    // Standard navigation
    setPage(view);
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setPage('event-detail');
  };

  const handleReservationCreated = (reservation: any) => {
    setActiveReservation(reservation);
    setPage('checkout');
  };

  const handleRequireAuth = (destination: string) => {
    // Store where the user was trying to go so they can auto-route back on login success
    setOnSuccessDestination(destination);
    setPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="inline-flex animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-gray-500 font-semibold text-sm">Synchronizing booking profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dynamic persistent Header Navbar */}
      <Navbar currentView={page} onNavigate={handleNavigation} />

      {/* Main Core Viewport */}
      <main className="flex-1">
        {page === 'events' && (
          <EventsList onSelectEvent={handleSelectEvent} />
        )}

        {page === 'login' && (
          <Login
            onNavigate={setPage}
            onSuccessDestination={onSuccessDestination}
            setSuccessDestination={setOnSuccessDestination}
          />
        )}

        {page === 'signup' && (
          <Signup
            onNavigate={setPage}
            onSuccessDestination={onSuccessDestination}
            setSuccessDestination={setOnSuccessDestination}
          />
        )}

        {page === 'event-detail' && selectedEventId && (
          <EventDetail
            eventId={selectedEventId}
            onNavigateBack={() => setPage('events')}
            onReservationCreated={handleReservationCreated}
            onRequireAuth={handleRequireAuth}
          />
        )}

        {page === 'checkout' && activeReservation && (
          <ReservationCheckout
            reservation={activeReservation}
            onNavigateHome={() => setPage('events')}
            onBackToSeating={() => setPage('event-detail')}
          />
        )}
      </main>

      {/* Humble, clean professional visual Page Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center select-none">
        <p className="text-xs text-gray-450 font-semibold tracking-wide uppercase">
          EventSeat Booking Hub • Verified Sandbox Environment
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
