import { Duration } from "@pb/google/protobuf/duration";

export const formatDuration = (duration: Duration): string => {
  const secondsPerMinute = 60;
  const secondsPerHour = 3600;
  const secondsPerDay = 86400;
  const daysPerMonth = 30.44; // avg month length
  const daysPerYear = 365.25; // considering leap years

  let totalSeconds = Number(duration.seconds);
  let nanos = duration.nanos;

  // First, calculate milliseconds from nanoseconds
  const milliseconds = Math.floor(nanos / 1_000_000);
  nanos -= milliseconds * 1_000_000; // Subtract the milliseconds part from nanos

  // Then, calculate microseconds from the remaining nanoseconds
  const microseconds = Math.floor(nanos / 1_000);
  nanos -= microseconds * 1_000; // Subtract the microseconds part, leaving only nanoseconds

  const years = Math.floor(totalSeconds / (secondsPerDay * daysPerYear));
  totalSeconds -= years * secondsPerDay * daysPerYear;

  const months = Math.floor(totalSeconds / (secondsPerDay * daysPerMonth));
  totalSeconds -= months * secondsPerDay * daysPerMonth;

  const days = Math.floor(totalSeconds / secondsPerDay);
  totalSeconds -= days * secondsPerDay;

  const hours = Math.floor(totalSeconds / secondsPerHour);
  totalSeconds -= hours * secondsPerHour;

  const minutes = Math.floor(totalSeconds / secondsPerMinute);
  totalSeconds -= minutes * secondsPerMinute;

  const seconds = totalSeconds; // Remaining seconds after calculating other components

  const parts = [
    years > 0 ? `${years}yr` : "",
    months > 0 ? `${months}mo` : "",
    days > 0 ? `${days}d` : "",
    hours > 0 ? `${hours}hr` : "",
    minutes > 0 ? `${minutes}m` : "",
    seconds > 0 ? `${seconds}s` : "",
    milliseconds > 0 ? `${milliseconds}ms` : "",
    microseconds > 0 ? `${microseconds}µs` : "",
    nanos > 0 ? `${nanos}ns` : "",
  ].filter((part) => part !== "");

  return parts.length > 0 ? parts.join(", ") : "0 seconds.";
};
