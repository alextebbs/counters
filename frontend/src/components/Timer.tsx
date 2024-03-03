"use client";

import { TimeDiff, getTimeDiff } from "@/utils/getTimeDiff";
import { FC, useEffect, useState } from "react";

interface TimerProps {
  timestamp?: Date;
  initialTimeDiff?: TimeDiff;
  paused: boolean;
  showMs?: boolean;
}

export const Timer: FC<TimerProps> = ({
  timestamp,
  initialTimeDiff,
  paused,
  showMs = false,
}) => {
  const [timeDiff, setTimeDiff] = useState(initialTimeDiff);

  useEffect(() => {
    if (paused || !timestamp) return;

    const timer = setInterval(() => setTimeDiff(getTimeDiff(timestamp)), 10);

    return () => clearInterval(timer);
  }, [timestamp, paused]);

  return (
    <div className="text-4xl mb-2 flex">
      <CounterDigit number={timeDiff?.days || 0} label="days" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff?.hours || 0} label="hrs" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff?.minutes || 0} label="mins" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff?.seconds || 0} label="secs" />
      {showMs && (
        <>
          <div className="flex gap-1 items-start justify-start flex-col">
            <span className="font-light text-neutral-700">.</span>
          </div>
          <CounterDigit number={timeDiff?.milliseconds || 0} label="ms" />
        </>
      )}
    </div>
  );
};

const CounterDigit = ({ number, label }: { number: number; label: string }) => {
  const formatNumber = (number: number, isMilliseconds = false) => {
    return isMilliseconds
      ? number.toString().padStart(2, "0")
      : number.toString().padStart(2, "0");
  };

  return (
    <div className="flex gap-1 items-center justify-center flex-col">
      <span className="font-light">{formatNumber(number, label === "ms")}</span>
      <span className="text-xs text-neutral-500 uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
};
