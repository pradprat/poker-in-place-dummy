import React, { useState, useEffect } from "react";
import { Button, FormControlLabel, FormGroup } from "@material-ui/core";
import Checkbox from "@material-ui/core/Checkbox";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import { IGame, IRebuyOptions } from "../../engine/types";

interface IProps {
  game: IGame;
  open: boolean;
  isTopUp?: boolean;
  onClose: ((event: {}) => void) | undefined;
  onSubmit: ((type?: string) => void) | undefined;
}

export default function FormDialog(props: IProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [selectedRebuyOption, setSelectedRebuyOption] = useState<
    keyof IRebuyOptions
  >(null);

  useEffect(() => {
    setHasConfirmed(!!selectedRebuyOption);
  }, [selectedRebuyOption]);

  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  const onSubmit = (ev: {}) => {
    if (props.onSubmit) {
      if (selectedRebuyOption) {
        props.onSubmit(selectedRebuyOption);
      } else {
        props.onSubmit();
      }
    }
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRebuyOption(event.target.name as keyof IRebuyOptions);
  };

  const isTopUp = props.isTopUp && props.game.tournamentDetails;
  const title = isTopUp ? "Top-Up" : "Buy Back In";
  const description = isTopUp
    ? "Would you like to top-up your stack?"
    : "Would you like to buy back in?";
  const consent = isTopUp
    ? `Yes, I consent to topping-up for ${props.game.tournamentDetails.buyIn &
    (props.game.tournamentDetails.topUpAmount /
      props.game.tournamentDetails.startingStack)
    }`
    : `Yes, I consent to rebuying for ${props.game.buyIn}`;

  const rebuyOptions = props.game.tournamentDetails?.rebuyOptions
    ? Object.keys(props.game.tournamentDetails.rebuyOptions)
      .map((key) => key as keyof IRebuyOptions)
      .filter((key) => props.game.tournamentDetails.rebuyOptions[key].active)
      .sort((key1, key2) => props.game.tournamentDetails?.rebuyOptions[key1].stack - props.game.tournamentDetails?.rebuyOptions[key2].stack)
    : ["stack100" as keyof IRebuyOptions];

  const showOldConsentForm = !props.game.tournamentDetails?.rebuyOptions;
  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      disableBackdropClick
      disableEscapeKeyDown
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        {showOldConsentForm && (
          <FormControlLabel
            control={
              <Checkbox
                checked={hasConfirmed}
                onChange={(ev) => setHasConfirmed(ev.currentTarget.checked)}
                name="checkedB"
                color="primary"
              />
            }
            label={consent}
          />
        )}
        {!showOldConsentForm && (
          <FormGroup>
            {rebuyOptions.map((key) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedRebuyOption === key}
                    onChange={handleChange}
                    name={key}
                  />
                }
                label={`I consent to buying ${Math.ceil(
                  props.game.tournamentDetails?.rebuyOptions[key]?.stack
                )} chips with an associated value of $${props.game.tournamentDetails?.rebuyOptions[key]?.value
                }`}
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary" disabled={!hasConfirmed}>
          {title}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
