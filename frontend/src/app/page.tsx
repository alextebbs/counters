import CounterListItem, { Counter } from "../components/CounterListItem";

// Idk why revalidateTag is not working
export const dynamic = "force-dynamic";

async function fetchCounters() {
  try {
    const response = await fetch("http://counter-api:8080/counters", {
      next: { tags: ["counters"] },
    });

    if (!response.ok) {
      console.error("Server responded with status:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const counters = await response.json();
    return counters;
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
