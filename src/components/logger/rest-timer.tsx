'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pause, Play, RotateCcw, Bell } from 'lucide-react';

const DEFAULT_REST_SECONDS = 90;

export function RestTimer() {
  const [seconds, setSeconds] = useState(DEFAULT_REST_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (!running && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      setCompleted(true);
      // Play sound or vibrate
      if (typeof window !== 'undefined') {
        if ('vibrate' in navigator) navigator.vibrate(300);
        try {
          const audio = new Audio('/media/notify.mp3');
          audio.play();
        } catch {}
      }
    }
  }, [seconds, running]);

  const handleStartPause = () => {
    if (seconds === 0) return;
    setRunning((r) => !r);
    setCompleted(false);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(DEFAULT_REST_SECONDS);
    setCompleted(false);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <Card className="flex flex-col items-center justify-center p-4 mb-4">
      <div className="text-3xl font-mono font-bold mb-2">{timeStr}</div>
      <div className="flex gap-2">
        <Button
          variant={running ? 'secondary' : 'default'}
          size="icon"
          onClick={handleStartPause}
          aria-label={running ? 'Pause' : 'Start'}
          disabled={seconds === 0}
        >
          {running ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        {completed && (
          <span className="ml-2 text-green-600 flex items-center gap-1 animate-pulse">
            <Bell className="h-5 w-5" /> Done!
          </span>
        )}
      </div>
    </Card>
  );
}
