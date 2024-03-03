import { CounterListItem } from "@/components/CounterListItem";
import { getRPC } from "@/grpc/client";
import { CounterServiceClient } from "@pb/counter/v1/counter.client";

// Idk why revalidateTag is not working
export const dynamic = "force-dynamic";

export default async function Home() {
  const { counters } = await getRPC(CounterServiceClient, "list", {});

  return (
    <>
      {counters && counters.length > 0 ? (
        counters
          .reverse()
          .map((counter) => (
            <CounterListItem
              key={counter.id}
              preview={false}
              paused={false}
              {...counter}
            />
          ))
      ) : (
        <div className="p-4 text-sm">Could not get counters :(</div>
      )}
    </>
  );
}
