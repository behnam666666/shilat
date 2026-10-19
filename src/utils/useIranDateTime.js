import { useEffect, useState } from "react";

function getIranTime() {
  const now = new Date();

  const time = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const weekday = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    weekday: "long",
  }).format(now);

  const date = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  return { time, weekday, date };
}

export default function useIranDateTime() {
  const [data, setData] = useState(getIranTime());

  useEffect(() => {
    const timer = setInterval(() => setData(getIranTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  return data;
}
