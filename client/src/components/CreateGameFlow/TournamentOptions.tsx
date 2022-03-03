import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Tooltip,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  ListItem,
  ListItemIcon,
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  InputBaseComponentProps,
} from "@material-ui/core";
import {
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
} from "@material-ui/icons";

import {
  GameMode,
  GameType,
  IUserDetails,
  TournamentRegistrationMode,
  IRebuyOptions,
} from "../../engine/types";
import "./CreateGameFlow.css";
import { getMaximumParticipants } from "../../engine";
import { generateTournamentStructure } from "../../engine/tournament";

const roundToStep = (step: number, amount: number) => Math.ceil(amount / step) * step;

const useStyles = makeStyles((theme) => ({
  labelWithIcon: {
    display: "flex",
    alignItems: "center",
    "& svg": {
      marginLeft: "0.5rem",
    },
  },
  customWidthTooltip: {
    minWidth: "35rem",
  },
  accordion: {
    margin: "16px 0",
  },
}));

interface ITournamentOptionsProps {
  type: GameType;
  mode: GameMode;
  perPlayer: boolean;
  handleModeChanged: { (value: GameMode): void };
  userDetails: IUserDetails;
  buyInAmount: number;
  setBuyInAmount: { (val: number): void };
  title: string;
  setTitle: { (val: string): void };
  details: ICreateTournamentDetails;
  onChange: { (val: ICreateTournamentDetails): void };
  supportedModes?: GameMode[];
  rebuyOptions?: IRebuyOptions;
  onRebuyChange: { (val: IRebuyOptions): void };
}

const IconWithTooltip = ({ title }: { title: string }) => {
  const classes = useStyles();
  return (
    <Tooltip
      classes={{ tooltip: classes.customWidthTooltip }}
      title={
        <div style={{ fontSize: "1.1rem", lineHeight: "1.5rem" }}>{title}</div>
      }
    >
      <HelpIcon />
    </Tooltip>
  );
};

export interface ICreateTournamentDetails {
  registrationMode: TournamentRegistrationMode;
  duration: number;
  blindRounds: number[];
  winnerPayouts: number[];
  rebuysThroughRound: number;
  startingStackAmount: number;
  topUpAmount: number;
  startTimerInSeconds: number;
  rebuyTimeInSeconds: number;
  roundBreakFinalRebuyTimeInSeconds: number;
  eliminationHangTimeInSeconds: number;
  lateRegistrationTimeInMinutes: number;
  timeoutInSeconds: number;
  minTableSizeBeforeRebalance: number;
  externalVideoConferencingLink: string;
  // Overflow rooms
  enableOverflowRooms: boolean;
  allowGuestsInOverflowRooms: boolean;
  overflowRoomUrl: string;
  // Perf features
  enablePerformantRebalances: boolean;
  enablePlayerWelcomeVideos: boolean;
  enableAutomation: boolean;
}

export default function TournamentOptions(props: ITournamentOptionsProps) {
  const classes = useStyles();
  const {
    mode,
    buyInAmount,
    setBuyInAmount,
    title,
    setTitle,
    details,
    onChange,
    rebuyOptions,
    onRebuyChange,
    userDetails,
  } = props;

  const handleRebuysChanged = (
    event: React.ChangeEvent<{
      name?: string;
      value: any;
    }>
  ) => {
    onChange({
      ...details,
      rebuysThroughRound: Number(event.target.value),
    });
  };

  const shouldShowEnableAutomationTesting = userDetails?.features?.AUTOMATION_TESTING;

  useEffect(() => {
    if (rebuyOptions.stack100.value !== buyInAmount) {
      onRebuyChange({
        stack25: {
          stack: 0.25 * details.startingStackAmount,
          value: 0.25 * buyInAmount,
          active: rebuyOptions.stack25.active,
        },
        stack50: {
          stack: 0.5 * details.startingStackAmount,
          value: 0.5 * buyInAmount,
          active: rebuyOptions.stack50.active,
        },
        stack100: {
          stack: 1 * details.startingStackAmount,
          value: 1 * buyInAmount,
          active: rebuyOptions.stack100.active,
        },
      });
    }
  }, [buyInAmount, details.startingStackAmount]);

  useEffect(() => {
    const duration = details.duration;
    const tournament = generateTournamentStructure(
      buyInAmount,
      getMaximumParticipants(mode),
      details.startingStackAmount,
      duration
    );

    onChange({
      ...details,
      winnerPayouts:
        details.winnerPayouts || tournament.winners.map((w) => w.percent),
      blindRounds:
        details.blindRounds?.length === tournament.rounds.length &&
          details.blindRounds[0] === tournament.rounds[0].bigBlind
          ? details.blindRounds
          : tournament.rounds.map((r) => r.bigBlind),
    });

    return () => { };
    // eslint-disable-next-line
  }, [details.duration, details.startingStackAmount]);

  return (
    <>
      {mode === GameMode.Multi_Table_Tournament && (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              margin="normal"
              id="duration"
              fullWidth
              label={
                <div className={classes.labelWithIcon}>
                  Title{" "}
                  <IconWithTooltip title="Give the tournament a name for management later" />
                </div>
              }
              variant="outlined"
              style={{ fontSize: 40 }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 1,
              }}
              value={title}
              onChange={(ev) =>
                setTitle(ev.currentTarget.value)
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              margin="normal"
              id="duration"
              fullWidth
              label={
                <div className={classes.labelWithIcon}>
                  Duration (minutes){" "}
                  <IconWithTooltip title="The length of the tournament. This value is divided by the number of rounds to determine the round length." />
                </div>
              }
              variant="outlined"
              type="number"
              style={{ fontSize: 40 }}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: 1,
              }}
              value={details.duration}
              onChange={(ev) =>
                onChange({
                  ...details,
                  duration: Number(ev.currentTarget.value),
                })
              }
              onBlur={() => {
                onChange({
                  ...details,
                  duration: Math.min(480, Math.max(30, details.duration)),
                });
              }}
            />
          </Grid>
        </Grid>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            margin="normal"
            id="buyIn"
            fullWidth
            label={
              <div className={classes.labelWithIcon}>
                Buy-in ($x){" "}
                <IconWithTooltip title="The entry amount. No money is transacted through this website, but a record of the buy-in and subsequent rebuys will be kept." />
              </div>
            }
            variant="outlined"
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
            margin="normal"
            id="startingStackAmount"
            fullWidth
            label={
              <div className={classes.labelWithIcon}>
                Starting Chip Stack{" "}
                <IconWithTooltip title="The number of chips each player will get for a full buy-in (or rebuy)." />
              </div>
            }
            variant="outlined"
            type="number"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              step: 1,
            }}
            value={details.startingStackAmount}
            onChange={(ev) =>
              onChange({
                ...details,
                startingStackAmount: Math.max(
                  100,
                  parseFloat(ev.currentTarget.value)
                ),
              })
            }
            onBlur={() => {
              onChange({
                ...details,
                startingStackAmount: Math.max(
                  100,
                  Math.round(details.startingStackAmount)
                ),
              });
            }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            margin="normal"
            id="round-blinds"
            fullWidth
            label={
              <div className={classes.labelWithIcon}>
                Big Blinds/Round{" "}
                <IconWithTooltip title="The size of the big blind per round. The blinds may repeat to keep the blinds the same for a longer period of time." />
              </div>
            }
            variant="outlined"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            value={details.blindRounds
              .map((r) => (Number.isNaN(r) ? "" : String(r)))
              .join(",")}
            onChange={(ev) =>
              onChange({
                ...details,
                blindRounds: ev.currentTarget.value
                  .split(",")
                  .map((x) => Number(x)),
              })
            }
            onBlur={() =>
              onChange({
                ...details,
                blindRounds: details.blindRounds.filter(
                  (r) => !Number.isNaN(r)
                ),
              })
            }
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            margin="normal"
            id="payouts"
            fullWidth
            label={
              <div className={classes.labelWithIcon}>
                Winner Payouts % (1st,2nd,3rd,...){" "}
                <IconWithTooltip title="The % that should go to each winner (if you want to link out to Paypal at the end)." />
              </div>
            }
            variant="outlined"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            value={details.winnerPayouts
              .map((p) => (Number.isNaN(p) ? "" : String(p * 100)))
              .join(",")}
            onChange={(ev) =>
              onChange({
                ...details,
                winnerPayouts: ev.currentTarget.value
                  .split(",")
                  .map((x) => Number(x) / 100),
              })
            }
            onBlur={() => {
              const payouts = details.winnerPayouts.filter(
                (r) => !Number.isNaN(r)
              );
              const total = payouts.reduce((sum, number) => sum + number, 0);
              if (total !== 1) {
                alert("Winner payouts need to sum to 100%");

                onChange({ ...details, winnerPayouts: [0.8, 0.2] });
                return;
              }
              onChange({ ...details, winnerPayouts: payouts });
            }}
          />
        </Grid>
      </Grid>
      <Typography
        style={{ margin: "0 0 1rem 0" }}
        variant="caption"
        component="div"
      >
        Each round will be{" "}
        {Math.floor(details.duration / Math.max(1, details.blindRounds.length))}{" "}
        minutes in length.
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth variant="outlined">
            <InputLabel shrink>
              <div className={classes.labelWithIcon}>
                Rebuy Permissions{" "}
                <IconWithTooltip title="If you want to allow rebuys, you may choose the round through which rebuys are allowed. After that last round, no rebuys will be allowed." />
              </div>
            </InputLabel>
            <Select
              value={details.rebuysThroughRound}
              onChange={handleRebuysChanged}
              label={
                <div>
                  Rebuy Permissions
                  <span style={{ width: "2rem", display: "inline-block" }}>
                    {" "}
                  </span>
                </div>
              }
            >
              <MenuItem value={-1}>No Rebuys Allowed</MenuItem>
              {details.blindRounds.map((blind, index) => (
                <MenuItem value={index} key={blind}>
                  Allow through round #{index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {details.rebuysThroughRound > -1 && (
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Paper style={{ padding: 8 }}>
              <List>
                Select rebuy options to be enabled in tournament:
                <ListItem>
                  <ListItemIcon>
                    <FormControlLabel
                      control={
                        <Checkbox
                          edge="start"
                          id="stack50"
                          checked={rebuyOptions.stack25.active}
                          tabIndex={-1}
                          disableRipple
                          onChange={() =>
                            onRebuyChange({
                              ...rebuyOptions,
                              stack25: {
                                ...rebuyOptions.stack25,
                                active: !rebuyOptions.stack25.active,
                              },
                            })
                          }
                        />
                      }
                      label="25% of chip stack:"
                    />
                  </ListItemIcon>
                  <Box ml={2} />
                  <Grid item xs={6}>
                    <TextField
                      margin="normal"
                      id="name"
                      fullWidth
                      label="cost ($)"
                      variant="outlined"
                      type="number"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 1,
                      }}
                      value={rebuyOptions.stack25.value}
                      onChange={(ev) =>
                        onRebuyChange({
                          ...rebuyOptions,
                          stack25: {
                            ...rebuyOptions.stack25,
                            value: Number(ev.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FormControlLabel
                      control={
                        <Checkbox
                          edge="start"
                          id="stack50"
                          checked={rebuyOptions.stack50.active}
                          tabIndex={-1}
                          disableRipple
                          onChange={() =>
                            onRebuyChange({
                              ...rebuyOptions,
                              stack50: {
                                ...rebuyOptions.stack50,
                                active: !rebuyOptions.stack50.active,
                              },
                            })
                          }
                        />
                      }
                      label="50% of chip stack:"
                    />
                  </ListItemIcon>
                  <Box ml={2} />
                  <Grid item xs={6}>
                    <TextField
                      margin="normal"
                      id="name"
                      fullWidth
                      label="cost ($)"
                      variant="outlined"
                      type="number"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 1,
                      }}
                      value={rebuyOptions.stack50.value}
                      onChange={(ev) =>
                        onRebuyChange({
                          ...rebuyOptions,
                          stack50: {
                            ...rebuyOptions.stack50,
                            value: Number(ev.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id="stack100"
                          edge="start"
                          checked={rebuyOptions.stack100.active}
                          tabIndex={-1}
                          disableRipple
                          onChange={() =>
                            onRebuyChange({
                              ...rebuyOptions,
                              stack100: {
                                ...rebuyOptions.stack100,
                                active: !rebuyOptions.stack100.active,
                              },
                            })
                          }
                        />
                      }
                      label="100% of chip stack:"
                    />
                  </ListItemIcon>
                  <Box ml={2} />
                  <Grid item xs={6}>
                    <TextField
                      margin="normal"
                      id="name"
                      fullWidth
                      label="cost ($)"
                      variant="outlined"
                      type="number"
                      style={{ fontSize: 40 }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        step: 1,
                      }}
                      value={rebuyOptions.stack100.value}
                      onChange={(ev) =>
                        onRebuyChange({
                          ...rebuyOptions,
                          stack100: {
                            ...rebuyOptions.stack100,
                            value: Number(ev.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
      <Accordion className={classes.accordion}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          Advanced Options
        </AccordionSummary>
        <AccordionDetails style={{ flexDirection: "column" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel>
                  <div className={classes.labelWithIcon}>
                    Registration Mode{" "}
                    <IconWithTooltip title="Open registration allows for any player with the link to join the game. Closed registration requires an uploaded attendee list and a unique code specified per player." />
                  </div>
                </InputLabel>
                <Select
                  value={details.registrationMode}
                  onChange={(ev) => {
                    onChange({
                      ...details,
                      registrationMode: ev.target
                        .value as TournamentRegistrationMode,
                    });
                  }}
                  label={
                    <div>
                      Registration Mode{" "}
                      <span style={{ width: "2rem", display: "inline-block" }}>
                        {" "}
                      </span>
                    </div>
                  }
                >
                  <MenuItem value={TournamentRegistrationMode.Open}>
                    Open
                  </MenuItem>
                  <MenuItem value={TournamentRegistrationMode.Code}>
                    Closed
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {/* Advanced Options */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="startTimerInSeconds"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Start Timer (seconds){" "}
                    <IconWithTooltip title="The delay after starting the tournament before the first hand is dealt." />
                  </div>
                }
                type="number"
                variant="outlined"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.startTimerInSeconds}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    startTimerInSeconds: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    startTimerInSeconds: Math.max(
                      0,
                      Math.round(details.startTimerInSeconds)
                    ),
                  });
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="rebuyTimeInSeconds"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Rebuy Time Window (seconds){" "}
                    <IconWithTooltip title="The amount of time after a player busts out that they are allowed to rebuy before being eliminated." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.rebuyTimeInSeconds}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    rebuyTimeInSeconds: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    rebuyTimeInSeconds: Math.max(
                      0,
                      Math.round(details.rebuyTimeInSeconds)
                    ),
                  });
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="roundBreakFinalRebuyTimeInSeconds"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Final Round Break Time (seconds){" "}
                    <IconWithTooltip title="The amount of time before the first round after rebuys end." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.roundBreakFinalRebuyTimeInSeconds}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    roundBreakFinalRebuyTimeInSeconds: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    roundBreakFinalRebuyTimeInSeconds: Math.max(
                      0,
                      Math.round(details.roundBreakFinalRebuyTimeInSeconds)
                    ),
                  });
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="eliminationHangTimeInSeconds"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Elimination Hang Time (seconds){" "}
                    <IconWithTooltip title="The amount of time a player is allowed to interact with their table after being eliminated." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.eliminationHangTimeInSeconds}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    eliminationHangTimeInSeconds: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    eliminationHangTimeInSeconds: Math.max(
                      0,
                      Math.round(details.eliminationHangTimeInSeconds)
                    ),
                  });
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="timeoutInSeconds"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Player Timeout (seconds){" "}
                    <IconWithTooltip title="The amount of time a player has to act before being automatically folded." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.timeoutInSeconds}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    timeoutInSeconds: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    timeoutInSeconds: Math.max(
                      0,
                      Math.round(details.timeoutInSeconds)
                    ),
                  });
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="lateRegistrationTimeInMinutes"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Late Registration Time (minutes){" "}
                    <IconWithTooltip title="The amount of time a player is allowed to register to a closed tournament." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.lateRegistrationTimeInMinutes}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    lateRegistrationTimeInMinutes: Math.max(
                      0,
                      parseFloat(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    lateRegistrationTimeInMinutes: Math.max(
                      0,
                      Math.round(details.lateRegistrationTimeInMinutes)
                    ),
                  });
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="minTableSizeBeforeRebalance"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Min Table Size (before rebalance){" "}
                    <IconWithTooltip title="The minimum number of players allowed at a table before tables are rebalanced. For example, if the value is 4, a table of 8 and a table of 4 will not be rebalanced until the table of 4 drops to 3 players." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.minTableSizeBeforeRebalance}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    minTableSizeBeforeRebalance: Math.max(
                      0,
                      Number(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    minTableSizeBeforeRebalance: Math.max(
                      0,
                      Math.round(details.minTableSizeBeforeRebalance)
                    ),
                  });
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="minTableSizeBeforeRebalance"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    Top Up Amount (stack size){" "}
                    <IconWithTooltip title="The amount to charge for a top-up after the final round allowing rebuys. The player will be charged a proportional amount of the buy-in relative to the top up amount." />
                  </div>
                }
                variant="outlined"
                type="number"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.topUpAmount}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    topUpAmount: Math.max(
                      0,
                      Number(ev.currentTarget.value)
                    ),
                  })
                }
                onBlur={() => {
                  onChange({
                    ...details,
                    topUpAmount: Math.max(0, Math.round(details.topUpAmount)),
                  });
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="normal"
                id="externalVideoConferencingLink"
                fullWidth
                label={
                  <div className={classes.labelWithIcon}>
                    External Video Conferencing Link (optional){" "}
                    <IconWithTooltip title="A link to an existing Zoom meeting that will be embedded and auto-joined in the lobby. Links should be of the form https://zoom.us/j/[meetingId]?pwd=[password]" />
                  </div>
                }
                variant="outlined"
                type="text"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 1,
                }}
                value={details.externalVideoConferencingLink}
                onChange={(ev) =>
                  onChange({
                    ...details,
                    externalVideoConferencingLink: ev.currentTarget.value,
                  })
                }
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                margin="normal"
                InputProps={{
                  inputComponent: OutlinedCheckboxWithLabel,
                  inputProps: {
                    component: CheckboxLabel,
                    label: "Enable overflow rooms",
                    checked: !!details.enableOverflowRooms,
                    onChange: () =>
                      onChange({
                        ...details,
                        enableOverflowRooms: !details.enableOverflowRooms,
                      }),
                  },
                }}
                fullWidth
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                label={
                  <div className={classes.labelWithIcon}>
                    Enable overflow rooms{" "}
                    <IconWithTooltip title="Overflow rooms are discussion rooms that will enable video chatting with a group observing a shared webpage (typically for a video stream)" />
                  </div>
                }
              />
            </Grid>
            {details.enableOverflowRooms && (
              <Grid item xs={6}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    inputComponent: OutlinedCheckboxWithLabel,
                    inputProps: {
                      component: CheckboxLabel,
                      label: "Allow guests in overflow rooms",
                      checked: !!details.allowGuestsInOverflowRooms,
                      onChange: () =>
                        onChange({
                          ...details,
                          allowGuestsInOverflowRooms: !details.allowGuestsInOverflowRooms,
                        }),
                    },
                  }}
                  fullWidth
                  style={{ fontSize: 40 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label={
                    <div className={classes.labelWithIcon}>
                      Allow guests in overflow rooms (optional){" "}
                      <IconWithTooltip title="If overflow rooms are enabled, this will allow guests to join the tournament with the code 'observer' and engage in the overflow rooms" />
                    </div>
                  }
                />
              </Grid>
            )}
            {details.enableOverflowRooms && (
              <Grid item xs={6}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  style={{ fontSize: 40 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label={
                    <div className={classes.labelWithIcon}>
                      Overflow room shared stream{" "}
                      <IconWithTooltip title="Provide a URL to a website that will be displayed next to the group chat" />
                    </div>
                  }
                  value={details.overflowRoomUrl}
                  onChange={(ev) =>
                    onChange({
                      ...details,
                      overflowRoomUrl: ev.currentTarget.value,
                    })
                  }
                  placeholder="https://path-to-shared-video-stream"
                />
              </Grid>
            )}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                margin="normal"
                InputProps={{
                  inputComponent: OutlinedCheckboxWithLabel,
                  inputProps: {
                    component: CheckboxLabel,
                    label: "Enable smooth rebalances (alpha)",
                    checked: !!details.enablePerformantRebalances,
                    onChange: () =>
                      onChange({
                        ...details,
                        enablePerformantRebalances: !details.enablePerformantRebalances,
                      }),
                  },
                }}
                fullWidth
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                label={
                  <div className={classes.labelWithIcon}>
                    Enable smooth rebalances (alpha){" "}
                    <IconWithTooltip title="Smooth rebalances will not pause the tournament to move players around. It will pause individual tables to let hands finish and move players between those tables. NOTE: This is alpha quality and is being tested." />
                  </div>
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                variant="outlined"
                margin="normal"
                InputProps={{
                  inputComponent: OutlinedCheckboxWithLabel,
                  inputProps: {
                    component: CheckboxLabel,
                    label: "Enable player welcome videos (alpha)",
                    checked: !!details.enablePlayerWelcomeVideos,
                    onChange: () =>
                      onChange({
                        ...details,
                        enablePlayerWelcomeVideos: !details.enablePlayerWelcomeVideos,
                      }),
                  },
                }}
                fullWidth
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                label={
                  <div className={classes.labelWithIcon}>
                    Enable player welcome videos (alpha){" "}
                    <IconWithTooltip title="Allow players to record a welcome video to be played in the lobby" />
                  </div>
                }
              />
            </Grid>
            {shouldShowEnableAutomationTesting && (
              <Grid item xs={6}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    inputComponent: OutlinedCheckboxWithLabel,
                    inputProps: {
                      component: CheckboxLabel,
                      label: "Enable automation testing (alpha)",
                      checked: !!details.enableAutomation,
                      onChange: () =>
                        onChange({
                          ...details,
                          enableAutomation: !details.enableAutomation,
                        }),
                    },
                  }}
                  fullWidth
                  style={{ fontSize: 40 }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label={
                    <div className={classes.labelWithIcon}>
                      Enable automation testing (alpha){" "}
                    </div>
                  }
                />
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
const OutlinedCheckboxWithLabel: React.FunctionComponent<InputBaseComponentProps> = (
  props
) => {
  const { component: Component, inputRef, ...other } = props;

  // implement `InputElement` interface
  React.useImperativeHandle(inputRef, () => ({
    focus: () => {
      // logic to focus the rendered component from 3rd party belongs here
    },
    // hiding the value e.g. react-stripe-elements
  }));

  // `Component` will be your `SomeThirdPartyComponent` from below
  return <Component {...other} />;
};

function CheckboxLabel(props: {
  label: string;
  checked: boolean;
  onChange: { (): void };
}) {
  return (
    <FormControlLabel
      style={{ padding: "8px 8px 0", flex: 1 }}
      control={
        <Checkbox
          checked={props.checked}
          onChange={props.onChange}
          name={props.label}
          color="secondary"
        />
      }
      label={props.label}
    />
  );
}
