export interface TimeDiff {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export const getTimeDiff = (timestamp: Date): TimeDiff => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const diffInSeconds = Math.max(diff / 1000, 0);

  const days = Math.floor(diffInSeconds / (3600 * 24));
  const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = Math.floor(diffInSeconds % 60);
  const milliseconds = Math.floor((diff % 1000) / 10); // Get milliseconds and round to 2 significant digits

  return { days, hours, minutes, seconds, milliseconds };
};
