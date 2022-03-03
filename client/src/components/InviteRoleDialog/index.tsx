import React, { useState } from "react";
import {
  Select,
  Button,
  MenuItem,
  InputLabel,
  FormControl,
} from "@material-ui/core";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import { toNearestCent } from "../../engine";
import { PlayerRole } from "../../engine/types";

interface IProps {
  defaultRole?: PlayerRole;
  open: boolean;
  onClose: ((event: {}) => void) | undefined;
  onSubmit?: (role: PlayerRole, name: string, email: string) => Promise<void>;
}

const allowedRoles = [PlayerRole.Organizer, PlayerRole.Featured];

export const roundToStep = (step: number, amount: number) => toNearestCent(Math.ceil(amount / step) * step);

export default function InviteRoleDialog(props: IProps) {
  const onClose = (ev: {}) => {
    if (props.onClose) {
      props.onClose(ev);
    }
  };
  const onSubmit = (ev: {}) => {
    if (props.onSubmit && role && name && email) {
      props.onSubmit(role, name, email);
    }
  };
  const [role, setRole] = useState(props.defaultRole ?? PlayerRole.Organizer);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <Dialog
      open={props.open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Invite Organizer or Featured Guest
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Specify the organizer or guest name and set the appropriate role.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          fullWidth
          label="Name..."
          type="text"
          style={{ fontSize: 40 }}
          InputLabelProps={{
            shrink: true,
          }}
          value={name}
          onChange={(ev) => setName(ev.currentTarget.value)}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              onSubmit(ev);
            }
          }}
        />
        <TextField
          margin="dense"
          id="email"
          fullWidth
          label="Email..."
          type="text"
          style={{ fontSize: 40 }}
          InputLabelProps={{
            shrink: true,
          }}
          value={email}
          onChange={(ev) => setEmail(ev.currentTarget.value)}
          onKeyPress={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              onSubmit(ev);
            }
          }}
        />
        <FormControl component="fieldset" fullWidth margin="normal">
          <InputLabel shrink>Role</InputLabel>
          <Select
            value={role}
            onChange={(ev) => setRole(ev.target.value as PlayerRole)}
          >
            {allowedRoles.map((role) => (
              <MenuItem value={role} key={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          Invite
        </Button>
      </DialogActions>
    </Dialog>
  );
}
