import React, { ChangeEvent, useState, FormEvent } from "react";
import { useAppState } from "../../state";

import Button from "@material-ui/core/Button";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { ReactComponent as AnonymousLogo } from "./anonymous-logo.svg";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { useDialog } from "../../../components/muibox";
import firebase from "firebase";
import * as firebaseui from "firebaseui";

import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";

import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { makeStyles } from "@material-ui/core/styles";
import { useLocation, useHistory } from "react-router-dom";
import { MiscOverrides } from "../../../theme";

const useStyles = makeStyles({
  container: {
    height: "100vh",
  },
  twilioLogo: {
    width: "55%",
    display: "block",
  },
  videoLogo: {
    width: "25%",
    padding: "2.4em 0 2.1em",
  },
  logo: {
    width: 40,
    height: 40,
  },
  paper: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    padding: "2em",
    marginTop: "4em",
    background: "white",
    color: "black",
    width: "600px",
    maxWidth: "90vw",
  },
  buttonContainer: {
    display: "flex",
  },
  button: {
    color: "#757575",
    background: "white",
    margin: "0.3em 0 0.2em",
    padding: "6px 16px",
    width: "300px",
    maxWidth: "300px",
    textTransform: "none",
    flex: 1,
    justifyContent: "flex-start",
    fontSize: "14px",
    "& svg": {
      fill: "#757575",
    },
  },
  errorMessage: {
    color: "red",
    display: "flex",
    alignItems: "center",
    margin: "1em 0 0.2em",
    "& svg": {
      marginRight: "0.4em",
    },
  },
  authContainer: {
    width: "100%",
    "& button.firebaseui-idp-button": {
      margin: "0.3em 0 0.2em",
      padding: "6px 16px",
      maxWidth: "300px",
      textTransform: "none",
      flex: 1,
      justifyContent: "flex-start",
    },
    "& .firebaseui-idp-icon": {
      height: 36,
      width: 36,
    },
  },
});

const theme = createMuiTheme({
  palette: {
    type: "light",
  },
});

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

export default function LoginPage() {
  const classes = useStyles();
  const { signIn, user, isAuthReady } = useAppState();
  const history = useHistory();
  const location = useLocation<{ from: Location }>();
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<Error | null>(null);
  const { prompt } = useDialog();

  const isAuthEnabled = Boolean(process.env.REACT_APP_SET_AUTH);
  const vars = getUrlVars();
  const redirectURI = vars.get("redirectURI") || "/";
  const isGameURI =
    redirectURI.indexOf("table") >= 0 || redirectURI.indexOf("tournament") >= 0 || redirectURI.indexOf("cfl") >= 0;

  const finalRedirectURI = isGameURI
    ? `/configure?redirectURI=${encodeURIComponent(redirectURI)}`
    : redirectURI;

  const redirectVars = new URLSearchParams(redirectURI.substring(redirectURI.indexOf('?') + 1));
  const code = redirectVars.get("code");
  const firstName = redirectVars.get("firstName");
  const lastName = redirectVars.get("lastName");

  React.useEffect(() => {
    if (isAuthReady && firstName && lastName) {
      login({ providerName: "anonymous", displayName: `${firstName} ${lastName}` });
    }
  }, [code, firstName, lastName, isAuthReady]);

  // Configure FirebaseUI.
  const uiConfig = React.useMemo(
    () => ({
      // Popup signin flow rather than redirect flow.
      signInFlow: window.self !== window.top ? "popup" : "redirect",
      signInSuccessUrl: finalRedirectURI,
      // We will display Google and Facebook as auth providers.
      signInOptions: [
        {
          provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          scopes: ["email", "public_profile"],
          customParameters: {
            auth_type: "reauthenticate",
          },
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          scopes: ["https://www.googleapis.com/auth/plus.login"],
          customParameters: {
            // Forces account selection even when one account
            // is available.
            prompt: "select_account",
          },
        },
        // {
        //   provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        //   signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
        //   forceSameDevice: false,
        //   requireDisplayName: true,
        //   emailLinkSignIn() {
        //     return {
        //       url: `${window.location.origin}/${
        //         getUrlVars().get("redirectURI") || "/"
        //       }`,
        //       handleCodeInApp: true,
        //     };
        //   },
        // },
        // {
        //   provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        //   recaptchaParameters: {
        //     type: "image", // 'audio'
        //     size: "invisible", // 'invisible' or 'compact'
        //     badge: "inline", //' bottomright' or 'inline' applies to invisible.
        //   },
        // },
      ],
      // Required to enable one-tap sign-up credential helper.
      credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
      callbacks: {
        signInSuccessWithAuthResult: function () {
          return true;
        },
      },
    }),
    [finalRedirectURI]
  );

  const login = (args?: any) => {
    setAuthError(null);
    signIn?.({ ...args, location })
      .then(() => {
        history.replace(location?.state?.from || { pathname: "/" });
      })
      .catch((err) => setAuthError(err));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login();
  };

  if (user || !isAuthEnabled) {
    window.location.assign(finalRedirectURI);
  }

  if (!isAuthReady) {
    return null;
  }

  const miscOverrides = MiscOverrides[window.location.hostname];
  let logoDark =
    miscOverrides && miscOverrides.logoDark
      ? miscOverrides.logoDark
      : "/logo.png";
  let title =
    miscOverrides && miscOverrides.title
      ? miscOverrides.title.toUpperCase()
      : "POKER IN PLACE";

  return (
    <ThemeProvider theme={theme}>
      <Grid
        container
        justify="center"
        alignItems="flex-start"
        className={classes.container}
      >
        <Paper className={classes.paper} elevation={6}>
          <img src={logoDark} alt={title} style={{ width: 210 }} />
          {process.env.REACT_APP_SET_AUTH === "firebase" && (
            <div>
              {/* <div className={classes.buttonContainer}>
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={() => login({ providerName: "google" })}
                  startIcon={<GoogleLogo className={classes.logo} />}
                >
                  Sign in with Google
                </Button>
              </div>
              <div className={classes.buttonContainer}>
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={() => login({ providerName: "facebook" })}
                  startIcon={<FacebookLogo className={classes.logo} />}
                >
                  Sign in with Facebook
                </Button>
              </div>
              <div className={classes.buttonContainer}>
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={() => login({ providerName: "phone" })}
                  startIcon={<FacebookLogo className={classes.logo} />}
                >
                  Sign in With Phone
                </Button>
              </div>
              <div className={classes.buttonContainer}>
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={() =>
                    prompt({
                      title: "Enter your email",
                      required: true,
                      cancel: { color: "white", text: "Cancel" },
                      ok: { color: "primary", text: "Login" },
                    }).then((displayName: string) => {
                      login({ providerName: "email", displayName });
                    })
                  }
                  startIcon={<FacebookLogo className={classes.logo} />}
                >
                  Sign in With Email
                </Button>
              </div> */}
              <div className={classes.buttonContainer}></div>
            </div>
          )}
          {process.env.REACT_APP_SET_AUTH === "passcode" && (
            <form onSubmit={handleSubmit}>
              <Grid container alignItems="center" direction="column">
                <TextField
                  id="input-passcode"
                  label="Passcode"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPasscode(e.target.value)
                  }
                  type="password"
                />
                <div>
                  {authError && (
                    <Typography
                      variant="caption"
                      className={classes.errorMessage}
                    >
                      <ErrorOutlineIcon />
                      {authError.message}
                    </Typography>
                  )}
                </div>
                <Button
                  variant="contained"
                  className={`${classes.button} firebaseui-idp-button mdl-button`}
                  type="submit"
                  disabled={!passcode.length}
                >
                  Submit
                </Button>
              </Grid>
            </form>
          )}
          <StyledFirebaseAuth
            className={classes.authContainer}
            uiConfig={uiConfig}
            firebaseAuth={firebase.auth()}
          />
          <Button
            variant="contained"
            className={`${classes.button} `}
            onClick={() =>
              prompt({
                title: "Choose a username:",
                required: true,
                cancel: { color: "white", text: "Cancel" },
                ok: { color: "primary", text: "Login" },
              }).then((displayName: string) => {
                login({ providerName: "anonymous", displayName });
              })
            }
            startIcon={<AnonymousLogo className={classes.logo} />}
            data-pup="sign-in-anonymously"
          >
            Sign in Anonymously
          </Button>
        </Paper>
      </Grid>
    </ThemeProvider>
  );
}
