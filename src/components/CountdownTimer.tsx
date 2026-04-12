import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  endsAt: string;
  onEnd?: () => void;
  className?: string;
}

export function CountdownTimer({ endsAt, onEnd, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, differenceInSeconds(new Date(endsAt), new Date())));

  useEffect(() => {
    if (timeLeft <= 0) { onEnd?.(); return; }
    const timer = setInterval(() => {
      const remaining = Math.max(0, differenceInSeconds(new Date(endsAt), new Date()));
      setTimeLeft(remaining);
      if (remaining <= 0) { onEnd?.(); clearInterval(timer); }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt, onEnd, timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft > 0 && timeLeft <= 300; // 5 minutes

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft <= 0) {
    return <span className={cn("font-display font-bold text-destructive", className)}>SELESAI</span>;
  }

  return (
    <div className={cn("flex items-center gap-1 font-display font-bold tabular-nums", isUrgent && "text-destructive countdown-urgent", className)}>
      {hours > 0 && <><span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">{pad(hours)}</span>:</>}
      <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">{pad(minutes)}</span>:
      <span className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">{pad(seconds)}</span>
    </div>
  );
}
