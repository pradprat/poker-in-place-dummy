import React, { memo, createContext, useContext } from "react";
import { styled } from "@material-ui/core/styles";

export const NetworkStatusVisibilityContext = createContext(false);

const Container = styled("div")({
  display: "flex",
  alignItems: "flex-end",
  "& div": {
    width: "23%",
    border: "1px solid black",
    boxSizing: "content-box",
    "&:not(:last-child)": {
      borderRight: "none",
    },
  },
});

const NetworkConnectionStatus = ({ className }: { className?: string }): JSX.Element => {
  const shouldRender = useContext(NetworkStatusVisibilityContext);

  if (!shouldRender) {
    return null;
  }

  return (
    <Container className={className}>
      {[0, 1, 2, 3].map((level) => (
        <div
          key={level}
          style={{
            height: `${20 * (level + 1)}%`,
            background: "#0c0",
          }}
        />
      ))}
    </Container>
  )
}

export default memo(NetworkConnectionStatus);
