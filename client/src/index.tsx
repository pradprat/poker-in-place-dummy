import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/react";
// import { version as appVersion } from "../package.json";
import { ConfirmProvider } from "material-ui-confirm";
import { SnackbarProvider } from "notistack";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CssBaseline, Link } from "@material-ui/core";
import { ClearAll } from "@material-ui/icons";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
  useParams,
  useHistory,
} from "react-router-dom";
import { ConnectOptions } from "twilio-video";
import { Provider } from "react-redux"

import { DialogProvider } from "./components/muibox";
import "./index.css";
import Home from "./Home";
import Game from "./Game";
import Manage from "./Manage";
import Tournament from "./components/Tournament";
import TournamentOrganizer from "./components/Tournament/components/Organizer";
import TournamentRegistration from "./components/Tournament/Registration";
import Results from "./Results";
import Summary from "./Summary";
import Extend from "./Extend";
import Profile from "./Profile";
import Meeting from "./Meeting";
import FAQ from "./FAQ";
import Info from "./Info";
import Msg from "./Msg";
import DebugTable from "./components/Table/DebugTable";
import Onboarding from "./components/Table/Onboarding";
import Configure from "./components/Table/Configure";
import CreateGameFlow from "./components/CreateGameFlow";
import ThemeProvider from "./components/ThemeProvider";
import SessionRecordingProvider from "./components/SessionRecordingProvider";
// import * as serviceWorker from "./serviceWorker";
import { initialize } from "./firebase";
import { CSSOverrides, MiscOverrides } from "./theme";
import "./types";
import AVConfirmDialogProvider from "./components/AVConfirmDialog/provider";
import AppStateProvider, { useAppState } from "./twilio/state";
import { VideoProvider } from "./twilio/components/VideoProvider";
import ErrorDialog from "./twilio/components/ErrorDialog/ErrorDialog";
import LoginPage from "./twilio/components/LoginPage/LoginPage";
import PrivateRoute from "./twilio/components/PrivateRoute/PrivateRoute";
import UnsupportedBrowserWarning from "./components/UnsupportedBrowserWarning/UnsupportedBrowserWarning";
import { GameTypeProvider } from "./hooks/useGameType";
import { GameType } from "./engine/types";
import IURLTableIDParams from "./types/IURLTableIDParams";
import store from "./store"

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

const VideoTournament = () => {
  const { error, setError } = useAppState();

  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <GameTypeProvider type={GameType.Tournament}>
          <Tournament />
        </GameTypeProvider>
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
};

const VideoTournamentOrganizer = () => {
  const { error, setError } = useAppState();

  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <GameTypeProvider type={GameType.Tournament}>
          <TournamentOrganizer />
        </GameTypeProvider>
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
};

const VideoTournamentRegistration = () => {
  const { error, setError } = useAppState();

  return (
    <UnsupportedBrowserWarning>
      <>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <GameTypeProvider type={GameType.Tournament}>
          <TournamentRegistration />
        </GameTypeProvider>
      </>
    </UnsupportedBrowserWarning>
  );
};

const VideoGame = () => {
  const { error, setError } = useAppState();
  const history = useHistory();
  const { URLTableID } = useParams<IURLTableIDParams>();

  if (error && error.code === 53118) {
    history.push(`/results/${URLTableID}`);
  }

  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <GameTypeProvider type={GameType.Cash}>
          <Game />
        </GameTypeProvider>
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
};
const VideoResults = () => {
  const { error, setError } = useAppState();

  return (
    <UnsupportedBrowserWarning>
      <VideoProvider options={connectionOptions} onError={setError}>
        <ErrorDialog dismissError={() => setError(null)} error={error} />
        <Results />
      </VideoProvider>
    </UnsupportedBrowserWarning>
  );
};
// const VideoHome = () => {
//   const { error, setError } = useAppState();

//   return (
//     <UnsupportedBrowserWarning>
//       <VideoProvider options={connectionOptions} onError={setError}>
//         <ErrorDialog dismissError={() => setError(null)} error={error} />
//         <Home />
//       </VideoProvider>
//     </UnsupportedBrowserWarning>
//   );
// };
const VideoDebugTable = () => {
  const { error, setError } = useAppState();

  return (
    <VideoProvider options={connectionOptions} onError={setError}>
      <ErrorDialog dismissError={() => setError(null)} error={error} />
      <GameTypeProvider type={GameType.Cash}>
        <DebugTable />
      </GameTypeProvider>
    </VideoProvider>
  );
};

const VideoOnboarding = () => {
  const { error, setError } = useAppState();

  return (
    <VideoProvider options={connectionOptions} onError={setError}>
      <ErrorDialog dismissError={() => setError(null)} error={error} />
      <GameTypeProvider type={GameType.Tournament}>
        <Onboarding />
      </GameTypeProvider>
    </VideoProvider>
  );
};

const VideoConfigure = () => {
  const { error, setError } = useAppState();

  return (
    <VideoProvider options={{ ...connectionOptions }} onError={setError}>
      <ErrorDialog dismissError={() => setError(null)} error={error} />
      <Configure />
    </VideoProvider>
  );
};

const ErroredCreateGameFlow = () => {
  const { error, setError } = useAppState();

  return (
    <>
      <ErrorDialog dismissError={() => setError(null)} error={error} />
      <CreateGameFlow />
    </>
  );
};

if (window.location.host.indexOf("localhost") < 0) {
  let errorCount = 0;
  let errorCounterStart = new Date().getTime();
  Sentry.init({
    beforeSend: (event, hint) => {
      // Prevent single users from spamming - reset every 10 min
      if (errorCounterStart + 1000 * 60 * 10 < new Date().getTime()) {
        errorCounterStart = new Date().getTime();
        errorCount = 0;
      }
      if (errorCount++ > 10) {
        return null;
      }
      return event;
    },
    dsn:
      process.env.REACT_APP_SENTRY_DSN ||
      "https://db2bea16c81442399d31c1ae9f11e530@o384438.ingest.sentry.io/5215675",
    release: `poker-in-place@${process.env.REACT_APP_SENTRY_RELEASE}`,
  });
}
initialize();

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

const cssOverride = CSSOverrides[window.location.hostname];
const miscOverrides = MiscOverrides[window.location.hostname];

if (miscOverrides && miscOverrides.favIcon) {
  // @ts-ignore
  document.getElementById("favicon").href = miscOverrides.favIcon;
}
if (miscOverrides && miscOverrides.touchIcon) {
  // @ts-ignore
  document.getElementById("touchicon").href = miscOverrides.touchIcon;
}
if (miscOverrides && miscOverrides.manifest) {
  // @ts-ignore
  document.getElementById("manifest").href = miscOverrides.manifest;
}
if (miscOverrides && miscOverrides.title) {
  document.title = miscOverrides.title;
}

const stripePromise = loadStripe(
  miscOverrides && miscOverrides.stripeClientKey
    ? miscOverrides.stripeClientKey
    : process.env.REACT_APP_STRIPE_CLIENT_KEY
);
const customHomeComponent: JSX.Element =
  miscOverrides && miscOverrides.homeComponent
    ? miscOverrides.homeComponent()
    : null;

function ChanceForLife() {
  const code = parseInt(
    new URLSearchParams(window.location.search.slice(1)).get("code"),
    10
  );
  const rooms = [
    { id: "Qphdg9XfLaALeCN7R1DK", name: "Ballroom #1", min: 1000, max: 1200 },
    { id: "XIqyHYNpQxhi10TrCNxB", name: "Ballroom #2", min: 2000, max: 2200 },
    { id: "jNC3A73oU9Dg5BXI9ghO", name: "Ballroom #3", min: 3000, max: 3200 },
    { id: "GvT7xtAfL68ENwAVvlph", name: "Ballroom #4", min: 4000, max: 4200 },
    { id: "t414gVT16Q3RFUR1wSts", name: "Ballroom #5", min: 5000, max: 5200 },
    { id: "GuWiHtDrejTDMYErKRi4", name: "Ballroom #6", min: 6000, max: 6200 },
    {
      id: "M1rMEma0zIbM2SOXHUNo",
      name: "Ballroom #7",
      min: 999999,
      max: 999999,
    },
  ];
  /*

Ballroom 1:     https://alpha.poker501.com/tournament/Qphdg9XfLaALeCN7R1DK/organizer
1000 – 1200
Ballroom 2      https://alpha.poker501.com/tournament/XIqyHYNpQxhi10TrCNxB/organizer
2000 – 2200
Ballroom 3:     https://alpha.poker501.com/tournament/jNC3A73oU9Dg5BXI9ghO/organizer
3000 – 3200
Ballroom 4:     https://alpha.poker501.com/tournament/GvT7xtAfL68ENwAVvlph/organizer
4000 – 4200
Ballroom 5      https://alpha.poker501.com/tournament/t414gVT16Q3RFUR1wSts/organizer
5000 – 5200
Ballroom 6      https://alpha.poker501.com/tournament/GuWiHtDrejTDMYErKRi4/organizer
6000 – 6200
Tournament 7: https://alpha.poker501.com/tournament/M1rMEma0zIbM2SOXHUNo/organizer
Open (no codes)
*/
  const matchingRoom = rooms.find(
    (room) => code >= room.min && code <= room.max
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        flexDirection: "column",
        fontSize: "1.5rem",
      }}
    >
      {matchingRoom ? (
        <>
          <h1>You are in {matchingRoom.name}</h1>
          <Link
            href={`/tournament/${matchingRoom.id}?code=${code || "observer"}`}
          >
            Click here to join...
          </Link>
          <br />
          <br />
          <br />
        </>
      ) : null}
      <h2>Ballrooms</h2>
      <ol>
        {rooms.map((room) => (
          <li>
            <Link href={`/tournament/${room.id}?code=${code || "observer"}`}>
              Click here to view {room.name}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Sentry.ErrorBoundary fallback="An error has occurred">
        <Elements stripe={stripePromise}>
          <ThemeProvider>
            <ConfirmProvider>
              <AVConfirmDialogProvider>
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
                    {cssOverride && <link rel="stylesheet" href={cssOverride} />}
                    <Router>
                      <AppStateProvider>
                        <Switch>
                          <Route exact path="/">
                            {customHomeComponent || <Home />}
                          </Route>
                          <PrivateRoute path="/table/:URLTableID">
                            <SessionRecordingProvider>
                              <VideoGame />
                            </SessionRecordingProvider>
                          </PrivateRoute>
                          <PrivateRoute path="/results/:URLTableID">
                            <VideoResults />
                          </PrivateRoute>
                          <PrivateRoute path="/summary/:URLTableID">
                            <Summary />
                          </PrivateRoute>
                          <PrivateRoute path="/extend/:URLTableID">
                            <Extend />
                          </PrivateRoute>
                          <PrivateRoute path="/profile">
                            <Profile />
                          </PrivateRoute>
                          <PrivateRoute path="/cfl">
                            <ChanceForLife />
                          </PrivateRoute>
                          <Route path="/login">
                            <UnsupportedBrowserWarning>
                              <LoginPage />
                            </UnsupportedBrowserWarning>
                          </Route>
                          <Route path="/table">
                            <VideoDebugTable />
                          </Route>
                          <Route path="/onboarding/embedded">
                            <Onboarding />
                          </Route>
                          <Route path="/onboarding">
                            <SessionRecordingProvider>
                              <VideoOnboarding />
                            </SessionRecordingProvider>
                          </Route>
                          <Route path="/configure">
                            <VideoConfigure />
                          </Route>
                          <PrivateRoute path="/create">
                            <ErroredCreateGameFlow />
                          </PrivateRoute>
                          <PrivateRoute path="/tournament/:URLTournamentID/registration">
                            <VideoTournamentRegistration />
                          </PrivateRoute>
                          <PrivateRoute path="/tournament/:URLTournamentID/organizer">
                            <SessionRecordingProvider>
                              <VideoTournamentOrganizer />
                            </SessionRecordingProvider>
                          </PrivateRoute>
                          <PrivateRoute path="/tournament/:URLTournamentID">
                            <SessionRecordingProvider>
                              <VideoTournament />
                            </SessionRecordingProvider>
                          </PrivateRoute>
                          <PrivateRoute path="/meeting/:number/:password">
                            <Meeting />
                          </PrivateRoute>
                          <PrivateRoute path="/manage">
                            <Manage />
                          </PrivateRoute>
                          <Route path="/msg">
                            <Msg />
                          </Route>
                          <Route path="/faq">
                            <FAQ />
                          </Route>
                          <Route path="/info">
                            <Info />
                          </Route>
                          <Redirect to="/" />
                        </Switch>
                      </AppStateProvider>
                    </Router>
                  </DialogProvider>
                </SnackbarProvider>
              </AVConfirmDialogProvider>
            </ConfirmProvider>
          </ThemeProvider>
        </Elements>
      </Sentry.ErrorBoundary>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register();
