import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import CounterListItem from "../components/CounterListItem";
import { CounterServiceClient } from "../../pb/counter/v1/counter.client";
import { Counter } from "../../pb/counter/v1/counter";

// Idk why revalidateTag is not working
export const dynamic = "force-dynamic";

let transport = new GrpcWebFetchTransport({
  baseUrl: "http://envoy-proxy:8080",
});

let client = new CounterServiceClient(transport);

async function fetchCounters() {
  try {
    let res = await client.getCounters({ id: "" });

    console.log("response", res.response.counters);

    return res.response.counters;
  } catch (error) {
    console.error("Failed to fetch counters:", error);
    return []; // Return an empty array or appropriate error handling
  }
}

export default async function Home() {
  const counters: Counter[] = await fetchCounters();

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
