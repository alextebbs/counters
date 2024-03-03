import { Timer } from "@/components/Timer";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import CreateEventForm from "@/components/CreateEventForm";
import { getRPC } from "@/grpc/client";
import { Timestamp } from "@pb/google/protobuf/timestamp";
import { CounterServiceClient } from "@pb/counter/v1/counter.client";
import { EventServiceClient } from "@pb/event/v1/event.client";

// Idk why revalidateTag is not working
export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { id } = params;

  const { counter } = await getRPC(CounterServiceClient, "get", { id });
  const { events } = await getRPC(EventServiceClient, "list", { id });

  if (!counter) return notFound();

  const { title, timestamp, count } = counter;

  return (
    <>
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="mb-4">
          <div className="mb-2 flex flex-col items-center justify-center">
            <div className="mb-2 text-neutral-200">It has been</div>
            <Timer
              paused={false}
              timestamp={timestamp && Timestamp.toDate(timestamp)}
            />
            <div className="text-neutral-200">since {title}.</div>
          </div>
          <div className="text-neutral-600 text-center">
            This has happened <span className="text-neutral-300">{count}</span>{" "}
            {count === 1 ? "time" : "times"}.
          </div>
        </div>
      </div>
      <CreateEventForm id={id} />
      <div>
        {events && events.length > 0 ? (
          events.reverse().map((event) => (
            <div
              key={event.id}
              className="p-4 flex flex-col border-neutral-800 border-b"
            >
              <div className="text-sm">{event.title}</div>
              {event.createdAt && (
                <div className="text-xs text-neutral-600">
                  {formatDistanceToNow(Timestamp.toDate(event.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-4 text-sm">Could not get events.</div>
        )}
      </div>
      <div className="uppercase tracking-[0.15em] text-xs px-4 py-2 text-neutral-700">
        <h3>End event log</h3>
      </div>
    </>
  );
};

export default Page;
