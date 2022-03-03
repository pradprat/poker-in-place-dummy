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
      <Grid
        container
        justify="center"
        alignItems="flex-start"
        className={classes.container}
      >
        <Paper className={classes.paper} elevation={6}>
          <img
            src="/logo.png"
            alt="POKER IN PLACE"
            style={{ width: 210, marginRight: "1rem", marginBottom: "3rem" }}
          />
          <Typography className={classes.element} variant="h3">
            Frequently Asked Questions
          </Typography>
          <Typography className={classes.element} variant="h4">
            Background
          </Typography>
          <Typography className={classes.element} variant="h5">
            Why did you build this?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Why not? I was looking for a creative outlet once the shelter in
            place took effect and I found myself missing certain social activies
            such as house poker games. I tried it out with a few friends and
            felt it would be nice to open up to everyone else.
          </Typography>
          <Typography className={classes.element} variant="h5">
            What technology did you use?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Twilio Video does the heaving lifting of video. Aside from that, the
            engine is written in TypeScript and running in Firebase using
            Firestore and their functions/lambdas. I use Stripe for payments
            (unfortunately necessary), and React for all of the rendering.
            That&apos;s about it.
          </Typography>
          <Typography className={classes.element} variant="h5">
            Why isn&apos;t it always free?
          </Typography>
          <Typography className={classes.element} variant="body1">
            I&apos;d honestly prefer not to charge, but all of the costs are just
            getting passed on to Twilio for the video rendering and as an
            individual in the midset of a pandemic, I don&apos;t really have the
            resources to cover the costs. If I can negotiate a better rate with
            Twilio, I&apos;ll pass that on here.
          </Typography>
          <Typography className={classes.element} variant="h5">
            Who are you?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Just a long-time developer and poker love. Currently working at
            Divvy Homes trying to re-imagine homeownership.
          </Typography>
          {/* <!--!> */}

          <Typography className={classes.element} variant="h4">
            Game Mechanics
          </Typography>
          <Typography className={classes.element} variant="h5">
            What variant of poker is this?
          </Typography>
          <Typography className={classes.element} variant="body1">
            It&apos;s no-limit texas hold-em.
          </Typography>
          <Typography className={classes.element} variant="h5">
            How do I play no-limit hold-em?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Take a look{" "}
            <Link
              href="https://www.google.com/search?q=how+do+you+play+no+limit+texas+holdem&oq=how+do+i+play+no+limit&aqs=chrome.1.69i57j0l6.4704j0j7&sourceid=chrome&ie=UTF-8"
              target="_blank"
            >
              here
            </Link>
            .
          </Typography>
          <Typography className={classes.element} variant="h5">
            Do you support tournaments or cash games?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Currently just cash games, but with enough demand, I&apos;ll add in blind
            increases.
          </Typography>
          <Typography className={classes.element} variant="h5">
            What happens when time runs out?
          </Typography>
          <Typography className={classes.element} variant="body1">
            The game will end and you&apos;ll be redirect to a screen showing each
            player&apos;s net proceeds. It will link out to PayPal to settle-up if
            you happen to be playing for real money.
          </Typography>
          <Typography className={classes.element} variant="h5">
            Do you take a rake?
          </Typography>
          <Typography className={classes.element} variant="body1">
            I know better than to do that. On a side note, for a great movie, go
            watch{" "}
            <Link href="https://www.netflix.com/title/80199959" target="_blank">
              Molly&apos;s Game
            </Link>
            .
          </Typography>

          {/* <!--!> */}

          <Typography className={classes.element} variant="h4">
            Troubleshooting
          </Typography>
          <Typography className={classes.element} variant="h5">
            What happens if I discover a bug?
          </Typography>
          <Typography className={classes.element} variant="body1">
            Please let me know. This was a personal project built in a week or
            so. There are likely edge cases I haven&apos;t covered. Please email me
            at{" "}
            <Link href="mailto:nick@pokerinplace.app">
              nick@pokerinplace.app
            </Link>{" "}
            if you find something off. Happy to refund your payment if you help
            make the game better.
          </Typography>

          {/* <!--!> */}

          <Typography className={classes.element} variant="h4">
            Development
          </Typography>
          <Typography className={classes.element} variant="h5">
            Can I contribute to this project?
          </Typography>
          <Typography className={classes.element} variant="body1">
            I&apos;d love that. I&apos;ll be making this open on GitHub once I make sure
            I&apos;m not leaking any keys (AGAIN).
          </Typography>
        </Paper>
      </Grid>
    </ThemeProvider>
  );
}
