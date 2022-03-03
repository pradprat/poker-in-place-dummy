import React, { MouseEvent } from "react";
import Button from "@material-ui/core/Button";
import { styled } from "@material-ui/core/styles";
import { ChevronRight as ChevronRightIcon } from "@material-ui/icons";

import "./PreGameOverlay.css";

import { IGame } from "../../engine/types";
import { getTabledPlayers } from "../../engine";

const getPlayerList = (players: any) => {
  // Nicholas Clark, Michelle Clark, and 2 others already joined...
  if (players.length === 0) {
    return "You are the first one here. Click join to get started...";
  } if (players.length === 1) {
    return `${players[0].name} is already here. Click join to join in...`;
  } if (players.length === 2) {
    return `${players[0].name} and ${players[1].name} are already here. Click join to join in...`;
  }
  return `${players[0].name}, ${players[1].name} and ${
    players.length - 2
  } others are already here. Click join to join in...`;
};

const Container = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  zIndex: 999,
});

interface IProps {
  game: IGame;
  title: string;
  onClick: (
    event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => void;
}

export default function PreGameOverlay(props: IProps) {
  return (
    <Container>
      <div className="buy-in">${props.game.buyIn}</div>
      <Button
        type="submit"
        color="primary"
        variant="contained"
        onClick={props.onClick}
        className="button"
        size="large"
      >
        {props.title} <ChevronRightIcon />
      </Button>
      <div
        style={{
          color: "#fff",
          fontSize: "1.5rem",
          margin: "4rem 0",
        }}
      >
        {getPlayerList(getTabledPlayers(props.game))}
      </div>
    </Container>
  );
}
