import React, { memo } from "react";

const SystemMessage = ({ message }: { message: string }): JSX.Element => (
  <div className="system-message">
    <div>
      <span>{message}</span>
    </div>
  </div>
);

export default memo(SystemMessage);