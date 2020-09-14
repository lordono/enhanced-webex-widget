import { useEffect, useState } from "react";

export function useTimer(interval = 1000) {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    function tick() {
      setDate(new Date());
    }
    var timerID = setInterval(() => tick(), interval);
    return function cleanup() {
      clearInterval(timerID);
    };
  }, [interval]);

  return date;
}
