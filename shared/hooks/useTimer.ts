"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * API returned by useTimer.
 */
export interface UseTimerReturn {
  /**
   * Elapsed time in milliseconds.
   */
  elapsedTime: number;

  /**
   * Whether the timer is currently running.
   */
  isRunning: boolean;

  /**
   * Starts or resumes the timer.
   */
  startTimer: () => void;

  /**
   * Pauses the timer.
   */
  stopTimer: () => void;

  /**
   * Stops the timer and resets elapsed time.
   */
  resetTimer: () => void;
}

/**
 * Simple stopwatch hook.
 *
 * Tracks elapsed time in milliseconds and supports
 * start, stop, and reset operations.
 */
export default function useTimer(): UseTimerReturn {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);

  const startTimer = useCallback(() => {
    if (isRunning) return;

    startedAtRef.current = Date.now();
    setIsRunning(true);
  }, [isRunning]);

  const stopTimer = useCallback(() => {
    if (!isRunning || startedAtRef.current === null) return;

    accumulatedRef.current += Date.now() - startedAtRef.current;

    startedAtRef.current = null;
    setIsRunning(false);
  }, [isRunning]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);

    accumulatedRef.current = 0;
    startedAtRef.current = null;

    setElapsedTime(0);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const runningTime =
        startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;

      setElapsedTime(accumulatedRef.current + runningTime);
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  return {
    elapsedTime,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer,
  };
}
