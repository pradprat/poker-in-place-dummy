import React, { ChangeEvent, useState, FormEvent } from "react";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import { createMuiTheme, ThemeProvider, makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  container: {
    height: "100vh",
  },
  paper: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "column",
    padding: "2em",
    marginTop: "4em",
    background: "white",
    color: "black",
    width: "80%",
    maxWidth: 800,
  },
  element: {
    marginTop: "0.25em",
    marginBottom: "0.25em",
  },
});

const theme = createMuiTheme({
  palette: {
    type: "light",
  },
});

export default function LoginPage() {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <link
        type="text/css"
        rel="stylesheet"
        href="https://source.zoom.us/1.8.1/css/bootstrap.css"
      />
      <link
        type="text/css"
        rel="stylesheet"
        href="https://source.zoom.us/1.8.1/css/react-select.css"
      />
      {/* <script src="https://source.zoom.us/1.8.1/lib/vendor/react.min.js"></script>
      <script src="https://source.zoom.us/1.8.1/lib/vendor/react-dom.min.js"></script>
      <script src="https://source.zoom.us/1.8.1/lib/vendor/redux.min.js"></script>
      <script src="https://source.zoom.us/1.8.1/lib/vendor/redux-thunk.min.js"></script>
      <script src="https://source.zoom.us/1.8.1/lib/vendor/jquery.min.js"></script>
      <script src="https://source.zoom.us/1.8.1/lib/vendor/lodash.min.js"></script> */}
      <Grid
        container
        justify="center"
        alignItems="flex-start"
        className={classes.container}
      >
        <Paper className={classes.paper} elevation={6}>
          <img
            src="/logo.png"
            alt="POKER501"
            style={{ width: 210, marginRight: "1rem", marginBottom: "3rem" }}
          />
          <Typography className={classes.element} variant="h5">
            Version
          </Typography>
          <Typography className={classes.element} variant="body1">
            {process.env.REACT_APP_BUILD_VERSION} (
            {process.env.REACT_APP_BUILD_DATE})
          </Typography>
        </Paper>
      </Grid>
    </ThemeProvider>
  );
}
