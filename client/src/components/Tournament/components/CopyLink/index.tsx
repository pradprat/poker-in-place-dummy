import React, { memo } from "react";
import { Link } from "@material-ui/core";

import { copyStringToClipboard } from "./utils";

const CopyLink = (): JSX.Element => {
  const copyToClipboard = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    copyStringToClipboard(
      window.location.toString().replace("/organizer", "?join")
    );
    ev.preventDefault();
    alert("Copied!");
  };

  return (
    <Link className="copy-link" href="#" onClick={copyToClipboard}>
      <img src="/custom/poker501.com/copy-link.png" alt="Click to Copy Link" />
      <span>Click to Copy Link</span>
    </Link>
  );
};

export default memo(CopyLink);