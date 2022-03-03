import React, { memo } from "react";
import { Badge } from "@material-ui/core";
import { Chat as ChatIcon } from "@material-ui/icons";

import useChat from "../../../../hooks/useChat";

const MessagesBadge = (): JSX.Element => {
  const { setMessagesRead, newMessageCount } = useChat();

  const onClick = (): void => {
    setMessagesRead();
  };

  return (
    <Badge badgeContent={newMessageCount} color="error" onClick={onClick}>
      <ChatIcon />
    </Badge>
  );
}

export default memo(MessagesBadge);