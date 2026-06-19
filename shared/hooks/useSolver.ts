"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { StateProp } from "@/shared/types";
import { SolverStatus } from "@/shared/components/ui/primitive";

export interface UseSolverReturn<TInput, TSolution> {
  status: StateProp<SolverStatus>;
  statusMsg: StateProp<string>;
  solution: StateProp<TSolution | null>;
  isVisible: StateProp<boolean>;
  solve: (input: TInput) => void;
  reset: () => void;
  toggleVisibility: () => void;
}

export default function useSolver<TInput, TSolution>(
  solver: (input: TInput) => TSolution | null,
  delay: number = 60,
): UseSolverReturn<TInput, TSolution> {
  const [status, setStatus] = useState<SolverStatus>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [solution, setSolution] = useState<TSolution | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const refs = useRef({ solver });
  useEffect(() => {
    refs.current = { solver };
  }, [solver]);

  const solve = useCallback(
    (input: TInput) => {
      setStatus("solving");

      setTimeout(() => {
        const { solver: currentSolver } = refs.current;

        try {
          const result = currentSolver(input);
          if (result === null) {
            setStatus("error");
            return;
          }

          setSolution(result);
          setStatus("done");
          setIsVisible(true);
        } catch (err) {
          console.error("[useSolver] Error:", err);
          setStatus("error");
        }
      }, delay);
    },
    [delay],
  );

  const toggleVisibility = useCallback(() => {
    setIsVisible((v) => !v);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setSolution(null);
    setIsVisible(false);
  }, []);

  return {
    status: { value: status, setValue: setStatus },
    statusMsg: { value: statusMsg, setValue: setStatusMsg },
    solution: { value: solution, setValue: setSolution },
    isVisible: { value: isVisible, setValue: setIsVisible },
    toggleVisibility,
    solve,
    reset,
  };
}
