import { formatDuration } from "@/utils/formatDuration";
import { Event } from "@pb/event/v1/event";
import { Timestamp } from "@pb/google/protobuf/timestamp";
import { formatDistanceToNow } from "date-fns";
import { FC } from "react";

interface EventsListProps {
  events: Event[];
}

export const EventsList: FC<EventsListProps> = ({ events }) => (
  <>
    {events && events.length > 0 ? (
      events.reverse().map((event, i) => (
        <div
          key={event.id}
          className="flex flex-row border-neutral-800 border-b"
        >
          <div className="flex flex-col p-4">
            <div className="text-sm">{event.title}</div>
            <input
              type="checkbox"
              id={`toggle-${event.id}`}
              className="peer hidden"
            />
            {event.createdAt && (
              <div className="text-xs text-neutral-500 peer-checked:hidden">
                happened{" "}
                {formatDistanceToNow(Timestamp.toDate(event.createdAt), {
                  addSuffix: true,
                })}
              </div>
            )}
            <div className="text-xs hidden text-neutral-500 peer-checked:block">
              {/* All this just to convince typescript it's ok to look at
                  previousEvent.duration 🤮 */}
              {(() => {
                if (i - 1 >= 0 && i - 1 < events.length) {
                  const previousEvent = events[i - 1];
                  if (previousEvent && previousEvent.duration) {
                    return `lasted ${formatDuration(previousEvent.duration)}`;
                  }
                }
                return null;
              })()}
            </div>
          </div>
          {i - 1 >= 0 && (
            <label
              htmlFor={`toggle-${event.id}`}
              className="select-none flex ml-auto px-4 flex-col justify-center items-center relative cursor-pointer group"
            >
              <div className="h-6 w-6 rounded-full flex items-center justify-center border border-neutral-600 text-neutral-600 text-xs group-hover:border-neutral-300 group-hover:text-neutral-300 cursor-pointer">
                i
              </div>
            </label>
          )}
        </div>
      ))
    ) : (
      <div className="p-4 text-sm">Could not get events.</div>
    )}
    <div className="uppercase tracking-[0.15em] text-xs px-4 py-2 text-neutral-700">
      <h3>End event log</h3>
    </div>
  </>
);
