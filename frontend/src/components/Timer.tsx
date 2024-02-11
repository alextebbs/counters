"use client";

import { FC, useEffect, useState } from "react";

interface TimerProps {
  timestamp?: Date;
  paused: boolean;
}

const Timer: FC<TimerProps> = ({ timestamp, paused }) => {
  const [timeDiff, setTimeDiff] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (paused || !timestamp) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diffInSeconds = Math.max(
        (now.getTime() - timestamp.getTime()) / 1000,
        0
      );

      const days = Math.floor(diffInSeconds / (3600 * 24));
      const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = Math.floor(diffInSeconds % 60);

      setTimeDiff({
        days,
        hours,
        minutes,
        seconds,
      });
    }, 50);

    return () => clearInterval(timer);
  }, [timestamp, paused]);

  return (
    <div className="text-4xl mb-2 flex">
      <CounterDigit number={timeDiff.days} label="days" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff.hours} label="hrs" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff.minutes} label="mins" />
      <div className="flex gap-1 items-start justify-start flex-col">
        <span className="font-light text-neutral-700">:</span>
      </div>
      <CounterDigit number={timeDiff.seconds} label="secs" />
    </div>
  );
};

const CounterDigit = ({ number, label }: { number: number; label: string }) => {
  const formatNumber = (number: number) => number.toString().padStart(2, "0");

  return (
    <div className="flex gap-1 items-center justify-center flex-col">
      <span className="font-light">{formatNumber(number)}</span>
      <span className="text-xs text-neutral-500 uppercase tracking-[0.15em]">
        {label}
      </span>
    </div>
  );
};

export default Timer;
