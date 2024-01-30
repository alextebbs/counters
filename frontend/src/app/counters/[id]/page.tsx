import { Counter } from "@/components/CounterListItem";
import Timer from "@/components/Timer";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import AddEventForm from "@/components/AddEventForm";

// Idk why revalidateTag is not working
export const dynamic = "force-dynamic";

interface Event {
  id: number;
  title: string;
  created_at: string;
  duration: number; // nanoseconds, because postgres
}

async function fetchCounter(id: string) {
  try {
    const response = await fetch(`http://counter-api:8080/counters?id=${id}`, {
      next: { tags: ["counters"] },
    });

    if (!response.ok) {
      console.error("Server responded with status:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const counter = (await response.json()) as Counter[];
    return counter[0];
  } catch (error) {
    console.error("Failed to fetch counters:", error);
    return null; // Return an empty array or appropriate error handling
  }
}

async function fetchEvents(id: string) {
  try {
    const response = await fetch(`http://counter-api:8080/events?id=${id}`, {
      next: { tags: ["events"] },
    });

    if (!response.ok) {
      console.error("Server responded with status:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const events = (await response.json()) as Event[];
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return null; // Return an empty array or appropriate error handling
  }
}

interface PageProps {
  params: {
    id: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { id } = params;

  const counter: Counter | null = await fetchCounter(id);
  const events: Event[] | null = await fetchEvents(id);

  if (!counter) return notFound();

  const { title, timestamp, count } = counter;

  return (
    <>
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div className="mb-4">
          <div className="mb-2 flex flex-col items-center justify-center">
            <div className="mb-2 text-neutral-200">It has been</div>
            <Timer paused={false} timestamp={timestamp} />
            <div className="text-neutral-200">since {title}.</div>
          </div>
          <div className="text-neutral-600 text-center">
            This has happened <span className="text-neutral-300">{count}</span>{" "}
            {count === 1 ? "time" : "times"}.
          </div>
        </div>
      </div>
      <AddEventForm id={id} />
      <div>
        {events && events.length > 0 ? (
          events.reverse().map((event) => (
            <div
              key={event.id}
              className="p-4 flex flex-col border-neutral-800 border-b"
            >
              <div className="text-sm">{event.title}</div>
              <div className="text-xs text-neutral-600">
                {formatDistanceToNow(new Date(event.created_at), {
                  addSuffix: true,
                })}
              </div>
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
