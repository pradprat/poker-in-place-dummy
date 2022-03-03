import firebase from "firebase";
import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  TextField,
  Select,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Paper,
  Tab,
  Link,
  Chip,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  Card,
  CardHeader,
  Radio,
  FormControlLabel,
} from "@material-ui/core";
import TabContext from "@material-ui/lab/TabContext";
import TabList from "@material-ui/lab/TabList";
import TabPanel from "@material-ui/lab/TabPanel";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { minimalTimezoneSet } from "compact-timezone-list";
import ChipInput from "material-ui-chip-input";
import {
  EmojiEvents as EmojiEventsIcon,
  LocalAtm as LocalAtmIcon,
  NewReleases as NewReleasesIcon,
} from "@material-ui/icons";

import {
  GameMode,
  PayType,
  GameType,
  IUserDetails,
  ILoggedInUser,
  SubscriptionType,
} from "../../engine/types";
import { useAppState } from "../../twilio/state";
import "./CreateGameFlow.css";
import {
  getModeCostDescription,
  getMaximumParticipants,
  getMaximumDuration,
  isGameModeSupported,
  getModeVideoEnabled,
  getModeCost,
} from "../../engine";
import { generateTournamentStructure } from "../../engine/tournament";

const roundToStep = (step: number, amount: number) => Math.ceil(amount / step) * step;

interface IProps {
  buyInAmount: number;
  setBuyInAmount: { (value: number): void };
  bigBlindAmount: number;
  setBigBlindAmount: { (value: number): void };
}

export default function CashOptions(props: IProps) {
  const {
    buyInAmount,
    setBuyInAmount,
    bigBlindAmount,
    setBigBlindAmount,
  } = props;
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Buy-in ($x)"
            type="number"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              step: 1,
            }}
            value={buyInAmount}
            onChange={(ev) =>
              setBuyInAmount(parseFloat(ev.currentTarget.value))
            }
            onBlur={() => {
              setBuyInAmount(
                Math.min(1000, roundToStep(1, Math.max(5, buyInAmount)))
              );
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Starting Big Blind ($x.xx)"
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
            onBlur={() => {
              setBigBlindAmount(
                Math.max(0.1, Math.min(buyInAmount, bigBlindAmount))
              );
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}
