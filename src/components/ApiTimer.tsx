import React, { useEffect, useState } from "react";
import { Text } from "react-native";

interface ApiTimerProps {
  isRunning: boolean;
}

export default function ApiTimer({ isRunning }: ApiTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  return <Text>⏱ {elapsed}s</Text>;
}
