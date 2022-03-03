import React, { useEffect } from "react";

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

export default function Msg() {
  useEffect(
    (): void => {
      const vars = getUrlVars();

      if (window.parent) {
        const args = Object.keys(vars).reduce(
          (acc, item) => ({ ...acc, item: vars.get(item) })
          , {});

        window.parent.postMessage(args, "*");
      }
    },
    [window.location.search],
  );

  return <div />;
}
