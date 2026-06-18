import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginProps {
  onNavigate: (view: string) => void;
  onSuccessDestination?: string;
  setSuccessDestination?: (view: string | undefined) => void;
}

export const Login: React.FC<LoginProps> = ({ 
  onNavigate, 
  onSuccessDestination,
  setSuccessDestination 
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigate to intended page or fall back to events list
      if (onSuccessDestination) {
        onNavigate(onSuccessDestination);
        if (setSuccessDestination) setSuccessDestination(undefined);
      } else {
        onNavigate('events');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-150 shadow-md overflow-hidden p-8">
        
        {/* Card Header Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Log in to book and manage your event seats</p>
        </div>

        {/* Display Errors */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold flex gap-2.5 items-start">
            <AlertCircle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10.5 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10.5 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors cursor-pointer shadow-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 font-medium">
            New to EventSeat?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </p>
        </div>

        {/* Guest simulation credit card */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 flex gap-2.5 items-start">
          <Sparkles className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-700">Preview Mode Account:</p>
            <p className="mt-1">Since code embeds real Mongo, you can register any new account instantly, or use default user credentials if pre-seeded.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
