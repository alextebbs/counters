import { Duration } from "@pb/google/protobuf/duration";

export const formatDuration = (duration: Duration): string => {
  const secondsPerMinute = 60;
  const secondsPerHour = 3600;
  const secondsPerDay = 86400;
  const daysPerMonth = 30.44; // avg month length
  const daysPerYear = 365.25; // considering leap years

  let totalSeconds = Number(duration.seconds);
  const nanos = duration.nanos;

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

  const seconds = totalSeconds;

  const parts = [
    years > 0 ? `${years} year${years > 1 ? "s" : ""}` : "",
    months > 0 ? `${months} month${months > 1 ? "s" : ""}` : "",
    days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "",
    hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "",
    minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "",
    seconds > 0 ? `${seconds} second${seconds > 1 ? "s" : ""}` : "",
    nanos > 0 ? `${nanos} nanosecond${nanos > 1 ? "s" : ""}` : "",
  ].filter((part) => part !== "");

  return parts.length > 0 ? parts.join(", ") : "0 seconds.";
};
