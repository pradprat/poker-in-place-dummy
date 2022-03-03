import React, { memo, useEffect, useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
} from "@material-ui/core";

import { useAppDispatch } from "../../../../store/hooks";
import { setRightDrawerTab, setShouldShowRightDrawer } from "../../../../store/features/rightDrawer/rightDrawerSlice";
import { RightDrawerTabs } from "../RightDrawer/types";
import { ITournamentDetails } from "../../../../engine/types";
import { useAppState } from "../../../../twilio/state";

import getPlayerPosition from "./utils";

interface IProps {
  shouldShow: boolean;
  tournament: ITournamentDetails;
}

const FinishedDialog = ({ shouldShow, tournament }: IProps): JSX.Element => {
  const [shouldRender, setShouldRender] = useState(false);
  const { user } = useAppState();

  const dispatch = useAppDispatch();

  const playerPosition = useMemo(
    () => tournament?.players && shouldRender
      ? getPlayerPosition(tournament, user.uid)
      : null,
    [tournament?.players, shouldRender, user.uid]
  );

  const modalText = playerPosition === 1
    ? "Congratulations! You are the winner!"
    : `You've finished the tournament at #${playerPosition} place`;

  const onClose = (): void => {
    setShouldRender(false);
  };

  const onCheckLeaderboard = (): void => {
    setShouldRender(false);

    dispatch(setShouldShowRightDrawer(true));
    dispatch(setRightDrawerTab(RightDrawerTabs.Results));
  };

  useEffect(() => {
    if (shouldShow) {
      setShouldRender(true);
    }
  }, [shouldShow]);

  return (
    <Dialog
      open={shouldRender}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogContent>
        <Grid container alignItems="center" justify="center">
          <Typography variant="h5">
            {playerPosition && modalText}
          </Typography>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Keep Watching
        </Button>
        <Button onClick={onCheckLeaderboard} color="primary">
          Check Leaderboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(FinishedDialog);