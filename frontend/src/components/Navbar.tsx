import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User, Compass } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('events');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('events')}
              className="flex items-center gap-2 text-xl font-bold text-slate-800 tracking-tight cursor-pointer"
            >
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Ticket className="w-5 h-5" />
              </div>
              <span>Event<span className="text-indigo-600">Seat</span></span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                currentView === 'events'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Events</span>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
