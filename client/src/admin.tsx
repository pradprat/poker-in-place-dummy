import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/browser";
import { ConfirmProvider } from "material-ui-confirm";
import { DialogProvider } from "muibox";
import { SnackbarProvider } from "notistack";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import jsCookie from "js-cookie";
import { CssBaseline } from "@material-ui/core";
import { ClearAll } from "@material-ui/icons";
import { MuiThemeProvider } from "@material-ui/core/styles";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useParams,
  useHistory,
} from "react-router-dom";
import { ConnectOptions } from "twilio-video";

import AppStateProvider, { useAppState } from "./twilio/state";
import "./index.css";
import Admin from "./components/admin";
// import * as serviceWorker from "./serviceWorker";
import { initialize } from "./firebase";
import theme, { createTheme } from "./theme";
import "./types";
import PrivateRoute from "./twilio/components/PrivateRoute/PrivateRoute";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_CLIENT_KEY);

// See: https://media.twiliocdn.com/sdk/js/video/releases/2.0.0/docs/global.html#ConnectOptions
// for available connection options.
const connectionOptions: ConnectOptions = {
  // video: {

  bandwidthProfile: {
    video: {
      mode: "grid",
      renderDimensions: {
        high: { height: 540, width: 960 },
        standard: { height: 270, width: 480 },
        low: { height: 90, width: 160 },
      },
    },
  },
  // dominantSpeaker: true,
  maxAudioBitrate: 12000,
  networkQuality: { local: 1, remote: 1 },
  preferredVideoCodecs: [{ codec: "VP8", simulcast: true }],
};

// // For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps.
// if (isMobile && connectionOptions?.bandwidthProfile?.video) {
//   connectionOptions!.bandwidthProfile!.video!.maxSubscriptionBitrate = 2500000;
// }

if (window.location.host.indexOf("localhost") < 0) {
  Sentry.init({
    dsn:
      "https://db2bea16c81442399d31c1ae9f11e530@o384438.ingest.sentry.io/5215675",
    release: `poker-in-place@${process.env.REACT_APP_SENTRY_RELEASE}`,
  });
}
initialize();

interface IThemededRendererProps {
  children?: React.ReactNode;
}

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

function ThemedRenderer(props: IThemededRendererProps) {
  // jsCookie
  const themeId = getUrlVars().get("themeId");
  let applyTheme = theme;
  if (themeId) {
    const themeJson = JSON.parse(atob(themeId));
    applyTheme = createTheme(themeJson.primary, themeJson.secondary);
    jsCookie.set("themeId", atob(themeId));
  } else {
    const themeCookie = jsCookie.get("themeId");
    if (themeCookie) {
      const themeJson = JSON.parse(themeCookie);
      applyTheme = createTheme(themeJson.primary, themeJson.secondary);
    }
  }
  return (
    <MuiThemeProvider theme={applyTheme}>{props.children}</MuiThemeProvider>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Elements stripe={stripePromise}>
      <ThemedRenderer>
        <ConfirmProvider>
          <SnackbarProvider
            className="snackbar"
            classes={{
              variantInfo: "info-snackbar",
              containerRoot: "snackbar",
            }}
            iconVariant={{
              info: <ClearAll style={{ marginRight: "0.5rem" }} />,
            }}
            dense
            maxSnack={0}
          >
            <DialogProvider>
              <CssBaseline />
              <Router>
                <AppStateProvider>
                  <Switch>
                    <PrivateRoute exact path="/admin">
                      <Admin />
                    </PrivateRoute>
                    <Redirect to="/admin" />
                  </Switch>
                </AppStateProvider>
              </Router>
            </DialogProvider>
          </SnackbarProvider>
        </ConfirmProvider>
      </ThemedRenderer>
    </Elements>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register();
