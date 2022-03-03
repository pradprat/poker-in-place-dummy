import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Link from "@material-ui/core/Link";

import { MiscOverrides } from "../../theme";

function DonateExplainerMessage() {
  return (
    <span>
      This project is a solo-developer run project. If you enjoy it, please
      consider making a donation so we can keep this game free (or low cost)
      and open to everyone.
      <br />
      {" "}
      <Link
        href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
          "nbclark@gmail.com"
        )}&currency_code=USD&item_name=${encodeURIComponent(
          "Poker501 Donation"
        )}`}
        target="_blank"
      >
        Send a small donation with PayPal
      </Link>
      <br />
      Venmo more your style? You can reach me at <b>@Nicholas-Clark-12</b>
      <br />
      Thanks so much!
    </span>
  );
}

const miscOverrides = MiscOverrides[window.location.hostname];
const title =
  miscOverrides && miscOverrides.title ? miscOverrides.title : "Poker501";
const CustomDonateExplainerMessage =
  miscOverrides && miscOverrides.donateExplainerMessage
    ? miscOverrides.donateExplainerMessage
    : DonateExplainerMessage;

interface IProps {
  open: boolean;
  isGameOver: boolean;
  onClose: ((event: {}) => void) | undefined;
}

export default function FormDialog(props: IProps) {
  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Please Help Support {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.isGameOver ? (
            <div>
              Hope you had a blast!
              <br />
              <br />
            </div>
          ) : null}
          <CustomDonateExplainerMessage />
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
}
