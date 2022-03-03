import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogTitle,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import AttachMoney from "@material-ui/icons/AttachMoney";
import ExitToApp from "@material-ui/icons/ExitToApp";
import Forward from "@material-ui/icons/Forward";

import { useDialog } from "../muibox";
import { useAppState } from "../../twilio/state";
import { IGame } from "../../engine/types";
import { AUTO_ADVANCE_DIRECTIVES, getTabledPlayers } from "../../engine";
import { callFirebaseGameFunction } from "../../firebase/rest";

interface IProps {
  open: boolean;
  onClose: ((event: {}) => void) | undefined;
  game: IGame;
  gameId: string;
}

export default function FormDialog(props: IProps) {
  const { user, setError } = useAppState();
  const { confirm } = useDialog();

  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };

  const handleSelectedPlayerChanged = (
    event: React.ChangeEvent<{
      name?: string;
      value: any;
    }>
  ) => {
    setSelectedPlayer(event.target.value as string);
  };

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [bigBlindAmount, setBigBlindAmount] = useState(props.game.currentBigBlind);
  const [
    autoAdvanceTimeout,
    setAutoAdvanceTimeout,
  ] = useState<NodeJS.Timeout>();
  const autoAdvanceTimeoutRef = React.useRef(autoAdvanceTimeout);
  autoAdvanceTimeoutRef.current = autoAdvanceTimeout;

  const handleRebuy = () => {
    confirm({
      message: "Are you sure you want to rebuy this player?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "rebuy",
        { playerId: selectedPlayer },
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };
  const handleLeaveGame = () => {
    confirm({
      message: "Are you sure you want to pause this player from the game?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "leave",
        { playerId: selectedPlayer },
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };
  const handleRemoveGame = () => {
    confirm({
      message: "Are you sure you want to remove this player from the game?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "remove",
        { playerId: selectedPlayer },
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };

  const handleForceAction = () => {
    confirm({
      message:
        "Are you sure you want to force action on this player (if timed out)?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "timeout",
        { playerId: selectedPlayer },
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };

  const advanceHandler = async () => {
    if (autoAdvanceTimeoutRef.current) {
      console.warn("Clearing auto-advance timer");
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    const result = await callFirebaseGameFunction(
      "respond",
      {},
      () => user!.getIdToken(),
      () => props.game.apiServerHost,
      props.gameId,
      setError
    );
    if (AUTO_ADVANCE_DIRECTIVES[result.directive]) {
      const timeout = setTimeout(() => {
        advanceHandler();
      }, AUTO_ADVANCE_DIRECTIVES[result.directive]);
      setAutoAdvanceTimeout(timeout);
    }
  };

  const handleForceTimeout = () => {
    confirm({
      message:
        "Are you sure you want to force action on this player (if timed out)?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "timeout",
        {},
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      await advanceHandler();
      onClose({});
    });
  };
  const handleUpdateBlinds = () => {
    confirm({
      message:
        "Are you sure you want to update the blinds? They will take effect on the next hand.",
    }).then(async () => {
      await callFirebaseGameFunction(
        "update/blinds",
        {
          bigBlindAmount: String(bigBlindAmount),
        },
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };

  const handleResetHand = () => {
    confirm({
      message:
        "Are you sure you want to reset this hand? A new hand will be dealt and bets will be returned.",
    }).then(async () => {
      await callFirebaseGameFunction(
        "reset",
        {},
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };

  const handleEndGame = () => {
    confirm({
      message: "Are you sure you want to end the game?",
    }).then(async () => {
      await callFirebaseGameFunction(
        "end",
        {},
        () => user!.getIdToken(),
        () => props.game.apiServerHost,
        props.gameId,
        setError
      );
      onClose({});
    });
  };

  const handleAutoAdvance = async () => {
    await callFirebaseGameFunction(
      "respond",
      {},
      () => user!.getIdToken(),
      () => props.game.apiServerHost,
      props.gameId,
      setError
    );
    onClose({});
  };

  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">Administer the Game</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>Hi</DialogContentText> */}
        <Grid container alignItems="flex-end" justify="flex-end" spacing={2}>
          <Grid item xs={8}>
            <TextField
              margin="dense"
              id="name"
              fullWidth
              label="Current Big Blind ($x.xx)"
              type="number"
              style={{ fontSize: 40 }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 0.1,
              }}
              value={bigBlindAmount}
              onChange={(ev) =>
                setBigBlindAmount(parseFloat(ev.currentTarget.value))
              }
            />
          </Grid>
          <Grid
            item
            xs={4}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleUpdateBlinds}
            >
              Update
            </Button>
          </Grid>
          <Grid item xs={8}>
            If a player is over their time limit, force action.
          </Grid>
          <Grid
            item
            xs={4}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleForceTimeout}
            >
              Timeout
            </Button>
          </Grid>
          <Grid item xs={8}>
            If the game is stuck and you don&apos;t want to restart the hand, try
            auto-advancing first.
          </Grid>
          <Grid
            item
            xs={4}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAutoAdvance}
            >
              Advance
            </Button>
          </Grid>
          <Grid item xs={8}>
            If the hand is stuck and something seems odd with the logic or
            betting, you can reset the current hand and start fresh.
          </Grid>
          <Grid
            item
            xs={4}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleResetHand}
            >
              Reset
            </Button>
          </Grid>
          <Grid item xs={8}>
            End the game when you&apos;re done playing
          </Grid>
          <Grid
            item
            xs={4}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={handleEndGame}
            >
              End
            </Button>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <InputLabel shrink>Manage Players</InputLabel>
              <Select
                value={selectedPlayer}
                onChange={handleSelectedPlayerChanged}
              >
                <MenuItem value="">Select Player...</MenuItem>
                {getTabledPlayers(props.game).map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    {player.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedPlayer ? (
            <Grid item xs={12}>
              <List component="nav" aria-label="main mailbox folders">
                <ListItem button onClick={handleRebuy}>
                  <ListItemText
                    primary={`Re-buy Player (Will add ${props.game.buyIn} to stack)`}
                  />
                  <ListItemIcon>
                    <AttachMoney />
                  </ListItemIcon>
                </ListItem>
                <ListItem button onClick={handleRemoveGame}>
                  <ListItemText primary="Remove Player from the Game" />
                  <ListItemIcon>
                    <ExitToApp />
                  </ListItemIcon>
                </ListItem>
                <ListItem button onClick={handleLeaveGame}>
                  <ListItemText primary="Pause Player from the Game" />
                  <ListItemIcon>
                    <ExitToApp />
                  </ListItemIcon>
                </ListItem>
                <ListItem button onClick={handleForceAction}>
                  <ListItemText primary="Force Player Action (Check/Fold)" />
                  <ListItemIcon>
                    <Forward />
                  </ListItemIcon>
                </ListItem>
              </List>
            </Grid>
          ) : null}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
}
