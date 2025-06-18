'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Pause, Play, RotateCcw, Bell } from 'lucide-react';
import {
  useUserPreferences,
  type RestTimerNotification,
} from '@/lib/stores/user-preferences';

const REST_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '1:30', seconds: 90 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
];

const DEFAULT_PRESET_INDEX = 2; // 2 minutes

const NOTIFICATION_OPTIONS: { label: string; value: RestTimerNotification }[] =
  [
    { label: 'Sound & Vibrate', value: 'both' },
    { label: 'Sound Only', value: 'sound' },
    { label: 'Vibrate Only', value: 'vibrate' },
    { label: 'None', value: 'none' },
  ];

export function RestTimer() {
  const [selectedPresetIndex, setSelectedPresetIndex] =
    useState(DEFAULT_PRESET_INDEX);
  const [seconds, setSeconds] = useState(
    REST_PRESETS[DEFAULT_PRESET_INDEX].seconds,
  );
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [completed, setCompleted] = useState(false);
  const { restTimerNotification, setRestTimerNotification } =
    useUserPreferences();

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 300);
    } catch {}
  };

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
      if (typeof window !== 'undefined') {
        if (
          (restTimerNotification === 'vibrate' ||
            restTimerNotification === 'both') &&
          'vibrate' in navigator
        ) {
          navigator.vibrate(300);
        }
        if (
          restTimerNotification === 'sound' ||
          restTimerNotification === 'both'
        ) {
          playBeep();
        }
      }
    }
  }, [seconds, running, restTimerNotification]);

  const handlePresetSelect = (index: number) => {
    if (running) return; // Don't allow changing preset while timer is running
    setSelectedPresetIndex(index);
    setSeconds(REST_PRESETS[index].seconds);
    setCompleted(false);
  };

  const handleStartPause = () => {
    if (seconds === 0) return;
    setRunning((r) => !r);
    setCompleted(false);
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(REST_PRESETS[selectedPresetIndex].seconds);
    setCompleted(false);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <Card className="flex flex-col items-center justify-center p-4 mb-4">
      {/* Preset Selection */}
      <div className="flex gap-1 mb-3">
        {REST_PRESETS.map((preset, index) => (
          <Button
            key={preset.label}
            variant={selectedPresetIndex === index ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetSelect(index)}
            disabled={running}
            className="text-xs px-2 py-1"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Select
        value={restTimerNotification}
        onValueChange={(val: RestTimerNotification) =>
          setRestTimerNotification(val)
        }
      >
        <SelectTrigger
          className="w-40 mb-3"
          size="sm"
          aria-label="Notification"
        >
          <SelectValue placeholder="Notification" />
        </SelectTrigger>
        <SelectContent>
          {NOTIFICATION_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Timer Display */}
      <div className="text-3xl font-mono font-bold mb-2">{timeStr}</div>

      {/* Control Buttons */}
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
