import React, { useState } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";

import { Fab } from "@material-ui/core";
import SettingsIcon from "@material-ui/icons/Settings";

import { DeviceSelectorDialog } from "./DeviceSelectorDialog";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      margin: theme.spacing(1),
      '& svg': {
        fontSize: 32
      },
    },
  })
);

export function DeviceSelectorButton() {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Fab
        onClick={() => setIsOpen(true)}
        data-cy-device-select
        title="Configure Audio & Video"
        className={classes.fab}
      >
        <SettingsIcon />
      </Fab>
      <DeviceSelectorDialog open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
