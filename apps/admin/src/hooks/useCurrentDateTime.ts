import { formatDate, formatTime } from "@warungmeng/i18n";
import type { RegionalFormat } from "@warungmeng/i18n";
import { useEffect, useState } from "react";

export interface CurrentDateTime {
  readonly date: string;
  readonly time: string;
}

function formatCurrentDateTime(value: Date, regionalFormat: RegionalFormat): CurrentDateTime {
  return {
    date: formatDate(value, { regionalFormat }),
    time: formatTime(value, { regionalFormat }),
  };
}

export function useCurrentDateTime(regionalFormat: RegionalFormat): CurrentDateTime {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  return formatCurrentDateTime(currentTime, regionalFormat);
}
