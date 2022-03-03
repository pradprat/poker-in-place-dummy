import React from "react";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@material-ui/core";
import { MuiPickersUtilsProvider, KeyboardDateTimePicker } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { minimalTimezoneSet } from "compact-timezone-list";
import ChipInput from "material-ui-chip-input";

const emailRegex = /(([a-zA-Z0-9_\-.+]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,63}))/;

interface IProps {
  title: string;
  setTitle: { (value: string): void };
  emails: string[];
  setEmails: { (value: string[]): void };
  timeZone: string;
  setTimeZone: { (value: string): void };
  selectedDate: Date;
  setSelectedDate: { (value: Date): void };
}

export default function SchedulingOptions(props: IProps) {
  const {
    title,
    setTitle,
    emails,
    setEmails,
    timeZone,
    setTimeZone,
    selectedDate,
    setSelectedDate,
  } = props;

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  return (
    <div>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Game Title"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            value={title}
            onChange={(ev) => setTitle(ev.currentTarget.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <ChipInput
            margin="dense"
            id="name"
            fullWidth
            label="Email invites (type email then hit enter). You can add more later..."
            // type="text"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            blurBehavior="clear"
            clearInputValueOnChange
            InputProps={{
              autoFocus: true,
              onBlur: (ev) => {
                if (ev.target.value) {
                  const addedEmails = ev.target.value
                    .split(/[ ;,]/)
                    .map((e) => {
                      const match = e.match(emailRegex);
                      return match ? match[1] : null;
                    })
                    .filter((e) => e)
                    .map((e) => e.trim());
                  setEmails([...emails, ...addedEmails]);
                }
              },
            }}
            value={emails}
            onAdd={(chip: string) => {
              const addedEmails = chip
                .split(/[ ;,]/)
                .map((e) => {
                  const match = e.match(emailRegex);
                  return match ? match[1] : null;
                })
                .filter((e) => e)
                .map((e) => e.trim());
              setEmails([...emails, ...addedEmails]);
            }}
            onDelete={(chip) => setEmails(emails.filter((e) => e !== chip))}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth margin="normal">
            <KeyboardDateTimePicker
              disablePast
              fullWidth
              margin="none"
              id="time-picker"
              label="Start Time (you can start sooner)"
              value={selectedDate}
              onChange={handleDateChange}
              KeyboardButtonProps={{
                "aria-label": "change time",
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth margin="normal">
            <InputLabel shrink>Time Zone</InputLabel>
            <Select
              value={timeZone}
              onChange={(ev) => setTimeZone(ev.target.value as string)}
            >
              {Object.values(minimalTimezoneSet).map((tz) => (
                <MenuItem value={tz.tzCode} key={tz.tzCode}>
                  {tz.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </MuiPickersUtilsProvider>
    </div>
  );
}
