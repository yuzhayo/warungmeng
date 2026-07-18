import { useEffect, useState } from "react";

export interface CurrentDateTime {
  readonly date: string;
  readonly time: string;
}

function formatCurrentDateTime(value: Date): CurrentDateTime {
  return {
    date: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(value),
    time: new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(value),
  };
}

export function useCurrentDateTime(): CurrentDateTime {
  const [currentDateTime, setCurrentDateTime] = useState(() => formatCurrentDateTime(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime(new Date()));
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  return currentDateTime;
}
