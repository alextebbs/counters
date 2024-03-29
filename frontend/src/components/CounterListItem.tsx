import { cn } from "@/utils/cn";
import Link from "next/link";
import { FC } from "react";
import { Timer } from "@/components/Timer";
import { Counter } from "@pb/counter/v1/counter";
import { Timestamp } from "@pb/google/protobuf/timestamp";
import { getTimeDiff } from "@/utils/getTimeDiff";

interface CounterListItemProps extends Counter {
  preview: boolean;
  paused: boolean;
}

export const CounterListItem: FC<CounterListItemProps> = ({
  preview,
  paused,
  title,
  count,
  timestamp,
  id,
}) => {
  return (
    <div
      className={cn(
        `p-4 flex flex-col border-neutral-800`,
        !preview && `border-b`
      )}
    >
      <Timer
        paused={paused}
        // We need to convert this to a Date here because NextJS can't pass
        // Protobuf Timestamps to the client, since they aren't "plain objects".
        timestamp={timestamp && Timestamp.toDate(timestamp)}
        initialTimeDiff={
          timestamp
            ? getTimeDiff(Timestamp.toDate(timestamp))
            : getTimeDiff(new Date())
        }
      />

      <h1 className="text-sm mb-1">Time since {title}.</h1>
      <h1 className="text-sm text-neutral-600">
        This has happened <span className="text-neutral-300">{count}</span>{" "}
        {count === 1 ? "time" : "times"}.
      </h1>

      {!preview && (
        <div className="flex space-x-2 mt-4">
          <Link
            href={`/counters/${id}`}
            className="bg-neutral-900 text-neutral-600 rounded-md px-4 py-1 uppercase tracking-[0.15em] text-xs"
          >
            View details
          </Link>
        </div>
      )}
    </div>
  );
};
