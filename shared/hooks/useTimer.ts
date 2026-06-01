"use client";

import { useEffect, useRef, useState } from "react";

export interface TimerHooksProps {
  elapsedTime: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export default function useTimer(): TimerHooksProps {
  const [isStop, setIsStop] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const startTimer = () => {
    setIsStop(false);
    setStartedAt(Date.now());
  };

  const stopTimer = () => {
    setIsStop(true);
  };

  const resetTimer = () => {
    setStartedAt(null);
    setElapsedTime(0);
  };

  useEffect(() => {
    if (startedAt && !isStop) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startedAt);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startedAt, isStop]);

  return {
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
  };
}
