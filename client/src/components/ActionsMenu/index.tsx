import React from "react";
import {
  withStyles,
  createStyles,
  Theme,
  makeStyles,
} from "@material-ui/core/styles";
import { FormControlLabel, Checkbox } from "@material-ui/core";
import Slider, { Mark } from "@material-ui/core/Slider";
import Fab from "@material-ui/core/Fab";
import Tooltip from "@material-ui/core/Tooltip";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ThumbsUpDownIcon from "@material-ui/icons/ThumbsUpDown";
import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbDownIcon from "@material-ui/icons/ThumbDown";
import Check from "@material-ui/icons/Check";
import Clear from "@material-ui/icons/Clear";
import Dialpad from "@material-ui/icons/Dialpad";
import { useHotkeys } from "react-hotkeys-hook";

import { IAction, ActionDirective } from "../../engine/types";
import BetDialog from "../BetDialog";
import { MiscOverrides } from "../../theme";

const miscOverrides = MiscOverrides[window.location.hostname];

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      // maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
    selected: {
      border: "2px solid white",
    },
    unselected: {
      border: "2px solid transparent",
    },
    sliderContainer: {
      position: "absolute",
      left: "50%",
      top: "-2.5rem",
      width: "30rem",
      justifyContent: "center",
      marginLeft: "-15rem",
      display: "flex",
      alignItems: "center",
    },
    slider: {
      flex: 1,
      margin: "0 1.5rem",
      marginBottom: "0 !important",
    },
    sliderFab: {
      width: "2rem",
      height: "2rem",
      minHeight: "2rem",
      margin: "0 2px",
    },
    sliderFabCancel: {
      backgroundColor: "#d9534f",
    },
    bar: {
      width: "1px",
      height: "9px",
      marginLeft: "1px",
      marginRight: "1px",
      backgroundColor: "currentColor",
    },
    autoCheckContainer: {
      // display: "none",
      // zoom: 1.2,
      zIndex: 200,
      background: "rgba(255,255,255,0.25)",
      borderRadius: "0.25rem",
      padding: "0.25rem 0.5rem",
      "& > label": {
        marginLeft: 0,
        marginRight: 0,
        "& > span": {
          padding: 0,
          paddingRight: "0.5rem",
        },
      },
    },
  })
);

function getIconFromAction(action: ActionDirective) {
  if (action === ActionDirective.Check) return <ThumbsUpDownIcon />;
  if (action === ActionDirective.Call) return <ThumbsUpDownIcon />;
  if (action === ActionDirective.Bet) return <ThumbUpIcon />;
  if (action === ActionDirective.Raise) return <ThumbUpIcon />;
  if (action === ActionDirective.AllIn) return <ThumbUpIcon />;
  if (action === ActionDirective.Fold) return <ThumbDownIcon />;
  return <ThumbsUpDownIcon />;
}

function geHotKeyFromAction(action: ActionDirective) {
  if (action === ActionDirective.Check) return " (C)";
  if (action === ActionDirective.Call) return " (C)";
  if (action === ActionDirective.Bet) return " (B)";
  if (action === ActionDirective.Raise) return " (R)";
  if (action === ActionDirective.AllIn) return " (A)";
  if (action === ActionDirective.Fold) return " (F)";
  return "";
}

function getTitleFromAction(
  action: IAction,
  formatCurrency?: (amount: number) => string
) {
  if (action.allIn && action.total)
    return `ALL-IN${geHotKeyFromAction(action.action)} to ${formatCurrency(
      action.total
    )}`;
  if (action.action === ActionDirective.Call)
    return `CALL${geHotKeyFromAction(action.action)} ${formatCurrency(
      action.contribution
    )} to ${formatCurrency(action.total)}`;
  return `${action.action.toString().toUpperCase()}${geHotKeyFromAction(
    action.action
  )}`;
}

export interface IActionsMenuProps {
  actions: IAction[];
  futureActions: IAction[];
  onClick: (action: IAction) => void;
  formatCurrency: (amount: number) => string;
  increment: number;
  maxBet: number;
}

export interface IRaiseSliderProps {
  increment: number;
  minimum: number;
  maximum: number;
  lastBet: number;
  onCancel: { (value: number): void };
  onAccept: { (value: number): void };
  onConfigure: { (value: number): void };
}

const PrettoSlider = withStyles((theme) => ({
  root: {
    color: theme.palette.primary.dark,
    height: "1rem",
  },
  thumb: {
    height: "3rem",
    width: "3rem",
    backgroundColor: "#000",
    border: "1px solid currentColor",
    marginTop: "-1rem",
    marginLeft: "-1.5rem",
    "&:focus, &:hover, &$active": {
      boxShadow: "inherit",
    },
    background: "url(/images/raise/pip-raise_chip-slider.png)",
    backgroundSize: "contain",
  },
  active: {},
  valueLabel: {
    left: "calc(-50% + 1.5rem - 2px)",
    fontWeight: 600,
    marginTop: "-0.5rem",
    "& > span": {
      width: "3rem",
      height: "3rem",
    },
  },
  track: {
    height: "10px",
    borderRadius: 4,
  },
  rail: {
    height: "10px",
    borderRadius: 4,
  },
}))(Slider);

export function RaiseSlider(props: IRaiseSliderProps) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const sliderRef = React.createRef<HTMLDivElement>();
  const minimum = props.minimum;
  const maximum = props.maximum;
  const marks: Mark[] = [{ value: minimum, label: "1x" }];
  const increment = Math.max(props.increment, props.lastBet);
  for (let i = 0; i < 5; ++i) {
    const amount = props.minimum + increment * (i + 1);
    if (amount >= maximum) {
      break;
    }
    marks.push({ value: amount, label: `${i + 2}x` });
  }

  // For debugging
  React.useEffect(() => {
    // @ts-ignore
    window.sliderValue = value;
    // @ts-ignore
    window.sliderSetValue = setValue;
    // @ts-ignore
    window.sliderMarks = marks;
  }, [marks, value, setValue]);

  const allInValue = marks[marks.length - 1].value + increment;
  marks.push({ value: allInValue, label: "All-in" });

  function valueLabelFormat(value: number, index: number) {
    if (value === allInValue) return "All-in";
    return `$${value}`;
  }

  const allowedValue =
    value === allInValue
      ? maximum
      : Math.min(Math.max(value, minimum), maximum);

  const { onAccept, onCancel } = props;

  const onKeyPress = React.useCallback(
    (ev: KeyboardEvent) => {
      if (ev.keyCode === 13) {
        ev.stopImmediatePropagation();
        onAccept(allowedValue);
      } else if (ev.keyCode === 27) {
        ev.stopImmediatePropagation();
        onCancel(allowedValue);
      }
    },
    [onAccept, onCancel, allowedValue]
  );

  React.useEffect(() => {
    if (sliderRef.current) {
      const thumbs = sliderRef.current.getElementsByClassName(
        "MuiSlider-thumb"
      );
      const thumb = thumbs[0] as HTMLSpanElement;
      thumb.focus();

      thumb.addEventListener("keydown", onKeyPress);
      return () => thumb.removeEventListener("keydown", onKeyPress);
    }
  }, [sliderRef, onKeyPress]);

  return (
    <div className={classes.sliderContainer} ref={sliderRef}>
      <Tooltip title="Specify Bet" aria-label="Specify Bet">
        <Fab
          color="default"
          aria-label="Specify Bet"
          onClick={() => props.onConfigure(allowedValue)}
          className={classes.sliderFab}
        // title="Specify Bet"
        >
          <Dialpad />
        </Fab>
      </Tooltip>
      <PrettoSlider
        className={classes.slider}
        value={value}
        min={minimum}
        step={increment}
        max={marks[marks.length - 1].value}
        getAriaValueText={valueLabelFormat}
        valueLabelFormat={valueLabelFormat}
        onChange={(event: React.ChangeEvent<{}>, v: number | number[]) =>
          setValue(v as number)
        }
        valueLabelDisplay="on"
        marks={marks}
      />
      <Tooltip title="Cancel Bet" aria-label="Cancel Bet">
        <Fab
          color="inherit"
          aria-label="Cancel Bet"
          onClick={() => props.onCancel(allowedValue)}
          className={`${classes.sliderFab} ${classes.sliderFabCancel}`}
        // title="Cancel Bet"
        >
          <Clear />
        </Fab>
      </Tooltip>
      <Tooltip title="Confirm Bet" aria-label="Confirm Bet">
        <Fab
          color="secondary"
          aria-label="Confirm Bet"
          onClick={() => props.onAccept(allowedValue)}
          className={classes.sliderFab}
          // title="Confirm Bet"
          id="confirm-bet"
        >
          <Check />
        </Fab>
      </Tooltip>
    </div>
  );
}

export default function ActionsMenu(props: IActionsMenuProps) {
  const classes = useStyles();
  const [selectedAction, setSelectedAction] = React.useState<string>(null);
  const [showBetDialog, setShowBetDialog] = React.useState(false);
  const [betAction, setBetAction] = React.useState<IAction>(null);

  const { onClick } = props;

  const onSelectAction = React.useCallback(
    (action: IAction, isFuture: boolean) => {
      if (isFuture) {
        if (action.action === selectedAction) {
          setSelectedAction(null);
        } else {
          setSelectedAction(action.action);
        }
      } else if (
        action.action === ActionDirective.Bet ||
        action.action === ActionDirective.Raise
      ) {
        if (true || miscOverrides?.showSliderBetting) {
          setBetAction(betAction ? null : action);
        } else {
          setBetAction(betAction ? null : action);
          setShowBetDialog(true);
        }
      } else {
        onClick(action);
      }
    },
    [selectedAction, betAction, onClick]
  );

  const onCloseBetDialog = () => {
    setShowBetDialog(false);
    setBetAction(null);
  };

  const onBetSubmitted = (betAmount: number) => {
    // TODO - raise amounts + min bets are wrong
    // Need to rethink contributions + min raises
    const updatedRaiseAction = {
      ...betAction,
      total: betAmount,
    };

    props.onClick(updatedRaiseAction);
    setShowBetDialog(false);
    setBetAction(null);
  };

  const findAndCallAction = (actions: ActionDirective[]) => {
    if (props.actions.length) {
      const action = props.actions.find((a) => actions.indexOf(a.action) >= 0);
      if (action) {
        onSelectAction(action, false);
      }
    } else {
      const action = props.futureActions.find(
        (a) => actions.indexOf(a.action) >= 0
      );
      if (action) {
        onSelectAction(action, true);
      }
    }
  };

  useHotkeys(
    "b,r",
    () => findAndCallAction([ActionDirective.Bet, ActionDirective.Raise]),
    {},
    [props.actions]
  );
  useHotkeys("a", () => findAndCallAction([ActionDirective.AllIn]), {}, [
    props.actions,
  ]);
  useHotkeys(
    "c",
    () => findAndCallAction([ActionDirective.Call, ActionDirective.Check]),
    {},
    [props.actions]
  );
  useHotkeys("f", () => findAndCallAction([ActionDirective.Fold]), {}, [
    props.actions,
  ]);

  React.useEffect(() => {
    if (selectedAction) {
      if (props.actions.length) {
        // Take action on the selected action
        let action = props.actions.find((a) => a.action === selectedAction);
        // If their call action is not found, we will fold
        if (!action) {
          action = props.actions.find((a) => a.action === ActionDirective.Fold);
        }
        setSelectedAction(null);
        if (action) {
          onSelectAction(action, false);
        }
      } else if (!props.futureActions.length) {
        setSelectedAction(null);
      }
    }
  }, [props.actions, selectedAction, props.futureActions, onSelectAction]);

  const renderActions = (actions: IAction[], isFuture: boolean) => actions.map((action) => (
    <ListItem
      key={action.action}
      button
      onClick={() => onSelectAction(action, isFuture)}
      data-pup={`action-${action.action}`}
      color="secondary"
      id={`action-${action.action}`}
      className={
        action.action === selectedAction
          ? classes.selected
          : classes.unselected
      }
      selected={action.action === selectedAction}
      disabled={betAction ? betAction.action !== action.action : false}
    >
      <ListItemIcon>{getIconFromAction(action.action)}</ListItemIcon>
      <ListItemText
        primary={getTitleFromAction(action, props.formatCurrency)}
      />
    </ListItem>
  ));

  return (
    <div className={classes.root}>
      <List component="nav" aria-label="main mailbox folders">
        {renderActions(props.actions, false)}
        {props.futureActions?.length ? (
          <div className={`${classes.autoCheckContainer} autocheck-container`}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!selectedAction}
                  onChange={(ev) =>
                    setSelectedAction(
                      selectedAction
                        ? null
                        : props.futureActions[props.futureActions.length - 1]
                          .action
                    )
                  }
                  name="autoCheckFold"
                  color="secondary"
                />
              }
              label="Auto check/fold your turn"
            />
          </div>
        ) : null}
        {/* {renderActions(props.futureActions, true)} */}
      </List>
      {(true || miscOverrides?.showSliderBetting) && betAction ? (
        <RaiseSlider
          minimum={Math.min(props.maxBet, betAction ? betAction.total : 0)}
          maximum={props.maxBet}
          increment={betAction ? betAction.raise : props.increment}
          lastBet={betAction ? betAction.contribution : 0}
          onConfigure={() => setShowBetDialog(true)}
          onCancel={() => setBetAction(null)}
          onAccept={onBetSubmitted}
        />
      ) : null}
      {showBetDialog ? (
        <BetDialog
          open={!!showBetDialog}
          minimum={Math.min(props.maxBet, betAction ? betAction.total : 0)}
          maximum={props.maxBet}
          step={props.increment}
          onClose={onCloseBetDialog}
          onSubmit={onBetSubmitted}
        />
      ) : null}
    </div>
  );
}
