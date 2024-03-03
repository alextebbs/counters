import { Timer } from "@/components/Timer";
import { notFound } from "next/navigation";
import CreateEventForm from "@/components/CreateEventForm";
import { getRPC } from "@/grpc/grpc-client";
import { Timestamp } from "@pb/google/protobuf/timestamp";
import { CounterServiceClient } from "@pb/counter/v1/counter.client";
import { EventServiceClient } from "@pb/event/v1/event.client";
import { EventsList } from "@/components/EventsList";
import { getTimeDiff } from "@/utils/getTimeDiff";

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
              initialTimeDiff={
                timestamp && getTimeDiff(Timestamp.toDate(timestamp))
              }
              showMs={true}
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
      <EventsList events={events} />
    </>
  );
};

export default Page;
