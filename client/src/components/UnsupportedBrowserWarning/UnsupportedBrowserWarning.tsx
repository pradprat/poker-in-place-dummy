import React from "react";
import Video from "twilio-video";
import { Container, Link, Typography, Paper, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  container: {
    marginTop: "0.75em",
    marginBottom: "0.75em",
  },
  paper: {
    padding: "1em",
  },
  heading: {
    marginBottom: "0.4em",
  },
  overlay: {
    zIndex: 9999,
    position: "absolute",
    left: 0,
    right: 0,
    top: 64,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    maxWidth: "unset",
  },
  dismiss: {
    textAlign: "right",
    marginTop: "1rem",
    fontWeight: 500,
  },
});

export default function ({ children }: { children: React.ReactElement }) {
  const [hideWarning, setHideWarning] = React.useState(false);
  const classes = useStyles();
  // @ts-ignore
  const isChrome = !!window.chrome;
  // @ts-ignore
  const isFirefox = typeof InstallTrigger !== "undefined";
  // @ts-ignore
  const isSafari = navigator.userAgent.indexOf("Safari") !== -1;
  const dismissDialog = (
    ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    ev.preventDefault();
    setHideWarning(true);
  };
  if (
    !hideWarning &&
    ((!isChrome && !Video.isSupported) ||
      (!isChrome && !isFirefox && !isSafari))
  ) {
    return (
      <>
        {children}
        <Container className={classes.overlay}>
          <Grid container justify="center" className={classes.container}>
            <Grid item xs={12} sm={6}>
              <Paper className={classes.paper}>
                <Typography variant="h5" className={classes.heading}>
                  {!Video.isSupported
                    ? "Browser not supported"
                    : "Browser not optimal"}
                </Typography>
                <Typography>
                  Please open this application in one of the supported browsers
                  such as Firefox or{" "}
                  <Link href="https://www.google.com/chrome/" target="_blank">
                    Chrome for optimal results
                  </Link>
                  .
                </Typography>
                <div className={classes.dismiss}>
                  <Link href="#" onClick={dismissDialog}>
                    [Dismiss]
                  </Link>
                </div>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </>
    );
  }

  return children;
}
