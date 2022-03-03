import React, { memo, FunctionComponent, useState, useEffect } from "react";

const CountdownTimer: FunctionComponent<{ endTime: number }> = ({ endTime }) => {
  const [millisecondsRemaining, setMillisecondsRemaining] = useState(0);

  useEffect(() => {
    if (endTime) {
      const interval = setInterval(() => {
        const countdownMillisecondsRemaining = Math.max(
          0,
          endTime - new Date().getTime()
        );
        if (!countdownMillisecondsRemaining) {
          clearInterval(interval);
        }
        setMillisecondsRemaining(countdownMillisecondsRemaining);
        return () => clearInterval(interval);
      }, 50);
    }
  }, [endTime]);

  let totalMillisecondsRemaining = millisecondsRemaining;
  const minutes = Math.floor(totalMillisecondsRemaining / 60 / 1000);
  totalMillisecondsRemaining -= minutes * 60 * 1000;
  const seconds = Math.floor(totalMillisecondsRemaining / 1000);
  totalMillisecondsRemaining -= seconds * 1000;
  const milliseconds = Math.floor(totalMillisecondsRemaining / 10);

  return (
    <div className="countdown">
      {`${minutes}`.padStart(2, "0")}:{`${seconds}`.padStart(2, "0")}.
      {`${milliseconds}`.padStart(2, "0")}
    </div>
  );
};

export default memo(CountdownTimer);
