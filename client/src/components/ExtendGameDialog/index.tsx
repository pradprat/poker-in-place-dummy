import React, { useState, useEffect } from "react";
import {
  TextField,
  Select,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import {
  EmojiEvents as EmojiEventsIcon,
  LocalAtm as LocalAtmIcon,
} from "@material-ui/icons";

import { GameMode, PayType, GameType } from "../../engine/types";
import "./ExtendGameDialog.css";
import {
  getModeCost,
  getMaximumParticipants,
} from "../../engine";

export type onExtendSubmitPayload = {
  mode: GameMode;
};
interface IProps {
  open: boolean;
  currentMode: GameMode;
  onClose: ((event: {}) => void) | undefined;
  onSubmit: ((payload: onExtendSubmitPayload) => void) | undefined;
}

interface IGameModeSelector {
  currentMode: GameMode;
  mode: GameMode;
  perPlayer: boolean;
  handleModeChanged: any;
}
const getModeCostMessage = (mode: GameMode, perPlayer: boolean) => {
  const cost = getModeCost(
    mode,
    perPlayer ? PayType.PerPlayer : PayType.UpFront
  );
  if (!cost) return " (Free)";
  return perPlayer ? ` ($${cost}/person)` : ` ($${cost})`;
};
function GameModeSelector(props: IGameModeSelector) {
  const playerCount = getMaximumParticipants(props.currentMode);

  return (
    <Grid item xs={12}>
      <FormControl component="fieldset" fullWidth>
        <InputLabel shrink>Extend Game By (minutes)</InputLabel>
        <Select value={props.mode} onChange={props.handleModeChanged}>
          {playerCount === 4
            ? [
              <MenuItem value="premium-4-60">
                  Up to 4 players, 60 min
                {getModeCostMessage(GameMode.Premium_4_60, props.perPlayer)}
              </MenuItem>,
              <MenuItem value="premium-4-120">
                  Up to 4 players, 120 min
                {getModeCostMessage(GameMode.Premium_4_120, props.perPlayer)}
              </MenuItem>,
              <MenuItem value="premium-4-180">
                  Up to 4 players, 180 min
                {getModeCostMessage(GameMode.Premium_4_180, props.perPlayer)}
              </MenuItem>,
            ]
            : [
              <MenuItem value="premium-8-60">
                  Up to 8 players, 60 min
                {getModeCostMessage(GameMode.Premium_8_60, props.perPlayer)}
              </MenuItem>,
              <MenuItem value="premium-8-120">
                  Up to 8 players, 120 min
                {getModeCostMessage(GameMode.Premium_8_120, props.perPlayer)}
              </MenuItem>,
              <MenuItem value="premium-8-180">
                  Up to 8 players, 180 min
                {getModeCostMessage(GameMode.Premium_8_180, props.perPlayer)}
              </MenuItem>,
            ]}
        </Select>
      </FormControl>
    </Grid>
  );
}

export default function FormDialog(props: IProps) {
  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  const onSubmit = (ev: {}) => {
    if (props.onSubmit) {
      props.onSubmit({
        mode,
      });
    }
  };
  const [mode, setMode] = useState<GameMode>(
    // props.currentMode !== GameMode.Free
    //   ? props.currentMode
    //   :
    GameMode.Premium_8_60
  );

  const handleModeChanged = (
    event: React.ChangeEvent<{
      name?: string;
      value: any;
    }>
  ) => {
    setMode(event.target.value as GameMode);
  };

  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">Create a New Game</DialogTitle>
      <DialogContent>
        <GameModeSelector
          currentMode={props.currentMode}
          mode={mode}
          perPlayer={false}
          handleModeChanged={handleModeChanged}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          Extend Game
        </Button>
      </DialogActions>
    </Dialog>
  );
}
