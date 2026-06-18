import React, { useState, useEffect } from 'react';
import { Timer, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  onExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = (): number => {
      const expirationTime = new Date(expiresAt).getTime();
      const difference = expirationTime - Date.now();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    // Set initial calculations
    const seconds = calculateTimeLeft();
    setTimeLeft(seconds);

    if (seconds <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  // Format seconds -> mm:ss
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isCritical = timeLeft < 60; // critical state if under 1 minute

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-base font-semibold tracking-wide transition-all ${
        isCritical
          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      {isCritical ? (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      ) : (
        <Timer className="w-5 h-5 text-amber-600 shrink-0" />
      )}
      <div className="flex gap-1.5 items-baseline">
        <span className="text-sm font-medium">Cart expires in</span>
        <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};
export default CountdownTimer;
