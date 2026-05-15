"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface UseTimerReturn {
  elapsed: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export function useTimer(): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const startTimer = useCallback(() => {
    startRef.current = Date.now() - elapsed * 1000;
    setRunning(true);
  }, [elapsed]);

  const stopTimer = useCallback(() => {
    setRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setElapsed(0);
    startRef.current = Date.now();
    setRunning(true);
  }, []);

  return { elapsed, startTimer, stopTimer, resetTimer };
}
