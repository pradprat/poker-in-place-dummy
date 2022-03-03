import React, { useState, memo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  TextField,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import { Autocomplete, AutocompleteChangeReason } from "@material-ui/lab";
import ExitToApp from "@material-ui/icons/ExitToApp";

import { useDialog } from "../../../muibox";
import { useAppState } from "../../../../twilio/state";
import {
  IGame,
  ITournamentDetails,
  ITournamentPlayer,
  PlayerRole,
} from "../../../../engine/types";
import { getTabledPlayersInTournament } from "../../../../engine/tournament";
import { callFirebaseTournamentFunctionWithJson } from "../../../../firebase/rest";
import InviteRoleDialog from "../../../InviteRoleDialog";
import { useSessionRecording } from "../../../SessionRecordingProvider";

interface IProps {
  open: boolean;
  onClose: ((event: {}) => void) | undefined;
  table?: IGame;
  tableId: string | null;
  tournamentId: string;
  tournament: ITournamentDetails;
}

const AdministerDialog = (props: IProps): JSX.Element => {
  const { user, setError } = useAppState();
  const { confirm, prompt, alert } = useDialog();
  const { tracker } = useSessionRecording();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ITournamentPlayer>();
  const [selectedPlayerInputValue, setSelectedPlayerInputValue] = useState<string>("");

  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  const handleSelectedPlayerChanged = (
    event: React.ChangeEvent<{}>,
    player: string | ITournamentPlayer,
    reason: AutocompleteChangeReason
  ) => {
    if (!player || typeof player === "string") {
      setSelectedPlayer(null);
      setSelectedPlayerInputValue("");
    } else {
      setSelectedPlayer(player as ITournamentPlayer);
      setSelectedPlayerInputValue((player as ITournamentPlayer).name);
    }
  };

  const [autoAdvanceTimeout] = useState<NodeJS.Timeout>();
  const autoAdvanceTimeoutRef = React.useRef(autoAdvanceTimeout);
  autoAdvanceTimeoutRef.current = autoAdvanceTimeout;

  const sortedPlayers = getTabledPlayersInTournament(
    props.tournament
  ).sort((p1, p2) => p1.name.localeCompare(p2.name));

  const { tournamentId } = props;

  const handleRemoveGame = () => {
    confirm({
      title: "Remove from Game",
      message:
        "Are you sure you want to remove this player from the tournament?",
    }).then(async () => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/remove",
        { playerId: selectedPlayer.id },
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      setSelectedPlayer(null);
      setSelectedPlayerInputValue("");
      alert("Player removed");
    });
  };

  const handlePauseGame = (): void => {
    prompt({
      title: "Pause the Game",
      message: "Enter a message for the tournament pause...",
    }).then(async (message = "Paused") => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/pause",
        { message },
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      onClose({});
    });
  };

  const handleResumeGame = () => {
    confirm({
      title: "Resume the Tournament",
      message: "Are you sure you want to resume the tournament?",
    }).then(async () => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/resume",
        {},
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      onClose({});
    });
  };

  const handleResetTournament = () => {
    confirm({
      title: "Reset Tournament",
      message:
        "Are you sure you want to reset this tournament? Hands will be reset and players will be moved.",
    }).then(async () => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/reset",
        {},
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      onClose({});
    });
  };

  const handleEndGame = () => {
    confirm({
      title: "End Tournament",
      message: "Are you sure you want to end the tournament?",
    }).then(async () => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/end",
        {},
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
      onClose({});
    });
  };

  const handleSnapshot = async () => {
    prompt({
      title: "Snapshot the Game",
      message: "Enter a message for the snapshot...",
    }).then(async (reason: string) => {
      await callFirebaseTournamentFunctionWithJson(
        "tournament/snapshot",
        { reason },
        () => user!.getIdToken(),
        () => props.tournament?.apiServerHost || props.table?.apiServerHost,
        tournamentId,
        setError,
        tracker
      );
    });
  };

  const inviteOrganizer = async (
    role: PlayerRole,
    name: string,
    email: string
  ) => {
    setShowInviteDialog(false);
    const result = await callFirebaseTournamentFunctionWithJson(
      "tournament/organizer/invite",
      { email, name, role },
      () => user!.getIdToken(),
      () => props.tournament?.apiServerHost || props.table?.apiServerHost,
      tournamentId,
      setError,
      tracker
    );
    if (result && result.code) {
      onClose({});
      const message = `${document.location.origin}/tournament/${tournamentId}/organizer?code=${result.code}`;
      setTimeout(() => {
        confirm({
          title: "Copy Organizer Invite Url",
          message,
        });
      }, 100);
    }
  };

  const downloadResults = async () => {
    const token = await user!.getIdToken();
    const apiServer =
      props.tournament?.apiServerHost ||
      props.table?.apiServerHost ||
      process.env.REACT_APP_API_ENDPOINT;
    const endpoint = `${apiServer}/tournament/results?tournamentId=${tournamentId}&authorization=Bearer ${token}`;

    document.location.assign(endpoint);
  };

  return (
    <>
      <Dialog
        open={props.open}
        onClose={onClose}
        aria-labelledby="form-dialog-title"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">Administer the Game</DialogTitle>
        <DialogContent>
          <Grid container alignItems="flex-end" justify="flex-end" spacing={2}>
            <Grid item xs={8}>
              You may pause the tournament at any time and provide a message for
              the players. Any in-progress hands will be allowed to finish.
              Click resume when you are ready to resume.
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handlePauseGame}
              >
                Pause Tournament
              </Button>
            </Grid>

            <Grid item xs={8}>
              Resume the tournament
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleResumeGame}
              >
                Resume Tournament
              </Button>
            </Grid>

            <Grid item xs={8}>
              If the tournament is stuck and something seems odd with the logic
              or betting, you can reset the tournament and start fresh.
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleResetTournament}
              >
                Reset
              </Button>
            </Grid>

            <Grid item xs={8}>
              End the tournament when you're done playing
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
            <Grid item xs={8}>
              Snapshot the tournament (debugging)
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSnapshot}
              >
                Snapshot
              </Button>
            </Grid>
            <Grid item xs={8}>
              Invite Organizer or Featured Guest
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowInviteDialog(true)}
              >
                Invite Organizer
              </Button>
            </Grid>
            <Grid item xs={8}>
              Download Results
            </Grid>
            <Grid
              item
              xs={4}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={downloadResults}
              >
                Download Results
              </Button>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset" fullWidth>
                <Autocomplete
                  value={selectedPlayer}
                  onChange={handleSelectedPlayerChanged}
                  inputValue={selectedPlayerInputValue}
                  onInputChange={(_, value) => {
                    setSelectedPlayerInputValue(value);
                  }}
                  options={sortedPlayers}
                  groupBy={(option) => option.tableId || "-No table-"}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Player..."
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>
            </Grid>
            {selectedPlayer ? (
              <Grid item xs={12}>
                <List component="nav" aria-label="main mailbox folders">
                  <ListItem button onClick={handleRemoveGame}>
                    <ListItemText
                      primary="Remove Player from the Tournament"
                    />
                    <ListItemIcon>
                      <ExitToApp />
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
      <InviteRoleDialog
        open={showInviteDialog}
        onSubmit={inviteOrganizer}
        onClose={() => setShowInviteDialog(false)}
      />
    </>
  );
}

export default memo(AdministerDialog);