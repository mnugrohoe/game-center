import { useEffect, useRef, useState } from "react";

export function useTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [active]);

  function reset() {
    setSeconds(0);
  }

  return {
    seconds,
    reset,
  };
}
