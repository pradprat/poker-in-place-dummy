import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import { toNearestCent, isNumeric } from "../../engine";

interface IProps {
  minimum: number | 0;
  maximum: number | 0;
  step: number | 1;
  open: boolean;
  onClose: ((event: {}) => void) | undefined;
  onSubmit: ((betAmount: number) => void) | undefined;
}

export const roundToStep = (step: number, amount: number) => toNearestCent(Math.ceil(amount / step) * step);

export default function FormDialog(props: IProps) {
  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  const onSubmit = (ev: {}, constrainedAmount?: number) => {
    const amount = isNumeric(constrainedAmount) ? constrainedAmount : betAmount;
    if (props.onSubmit && amount > 0) {
      props.onSubmit(amount);
    }
  };
  const [betAmount, setBetAmount] = useState(props.minimum);
  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">Raise Stakes to:</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You can bet in any increment of{" "}
          <big>${props.step.toLocaleString()}</big> from{" "}
          <big>${props.minimum.toLocaleString()}</big> to{" "}
          <big>${props.maximum.toLocaleString()}</big>
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          fullWidth
          label="Bet amount..."
          type="number"
          style={{ fontSize: 40 }}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            min: props.minimum,
            max: props.maximum,
            step: props.step,
          }}
          value={betAmount}
          onChange={(ev) => setBetAmount(parseFloat(ev.currentTarget.value))}
          onBlur={() => {
            setBetAmount(
              Math.min(
                props.maximum,
                roundToStep(props.step, Math.max(props.minimum, betAmount))
              )
            );
          }}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              const amount = betAmount;
              const constrainedAmount = Math.min(
                props.maximum,
                roundToStep(props.step, Math.max(props.minimum, amount))
              );
              setBetAmount(constrainedAmount);
              if (constrainedAmount === amount) {
                onSubmit(ev, constrainedAmount);
              }
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          Place Wager
        </Button>
      </DialogActions>
    </Dialog>
  );
}
