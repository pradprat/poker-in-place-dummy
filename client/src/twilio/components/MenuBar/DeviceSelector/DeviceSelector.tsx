import React, { useState } from 'react';

import {
  IconButton,
  Fab,
} from "@material-ui/core";
import SettingsIcon from '@material-ui/icons/Settings';

import {DeviceSelectorDialog} from './DeviceSelectorDialog';

export function DeviceSelector() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setIsOpen(true)} data-cy-device-select title="Configure Audio & Video">
        <SettingsIcon />
      </IconButton>
      <DeviceSelectorDialog open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
