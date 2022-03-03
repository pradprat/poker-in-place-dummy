import React from "react";
import { styled } from "@material-ui/core/styles";
import { ExpandMore as ArrowDownwardIcon } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import { useStripe } from "@stripe/react-stripe-js";
import ReactPlayer from "react-player";
import {
  Container as MaterialContainer,
  Typography,
  Button,
  Link,
  makeStyles,
} from "@material-ui/core";

import { useAppState } from "./twilio/state";
import "./Home.css";
import Header from "./components/Header";
import MockTable from "./components/Table/MockTable";
import { MiscOverrides } from "./theme";

const Container = styled("div")({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  overflow: "scroll",
});

const FullPage = styled("div")({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
  position: "relative",
});

const TableContainer = styled("div")({
  top: "15%",
  left: "15%",
  right: "15%",
  bottom: "15%",
  position: "absolute",
  zoom: 0.7,
});

const PromotionalBanner = styled("div")({
  top: "64px",
  left: "50%",
  width: "50vw",
  marginLeft: "-25vw",
  position: "absolute",
  backgroundColor: "#a8326b",
  zIndex: 1000,
  padding: "0.5rem",
  borderBottomLeftRadius: "15px",
  borderBottomRightRadius: "15px",
  textAlign: "center",
  "& > h2": {
    margin: 0,
  },
});

const scrollDown = () => {
  document
    .getElementById("fullPageTable")
    .scrollIntoView({ behavior: "smooth" });
};

// style={{  }}

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

const useStyles = makeStyles((theme) => ({
  header: {
    height: 64,
    "& > div": {
      height: 64,
    },
  },
  logo: {
    color: theme.palette.secondary.main,
    width: "25vw",
    height: "15vw",
    marginRight: "1rem",
    "& svg": {
      fill: "blue",
    },
    backgroundImage: "url(/logo.svg)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
  },
}));

function Home() {
  const { user, setError } = useAppState();
  const history = useHistory();
  const createGame = () => {
    history.push("/create");
  };
  const stripe = useStripe();
  const classes = useStyles();

  const miscOverrides = MiscOverrides[window.location.hostname];
  const title =
    miscOverrides && miscOverrides.title
      ? miscOverrides.title
      : "Poker in Place";

  return (
    <Container className="home">
      <FullPage>
        <Header
          title={title || "Poker in Place"}
          mobileModeEnabled={false}
          className={classes.header}
        />
        {/* <PromotionalBanner>
          <h2>Happy New Year from Poker-in-Place!</h2>
          <div>
            All games will be free until 1/10/2021 as a thank you for your
            support.
          </div>
        </PromotionalBanner> */}
        <div className="video-background">
          {/* <LocalVideoPreview /> */}
          <div className="overlay" />
        </div>
        <MaterialContainer maxWidth="md" className="hero">
          <div id="logo" className={classes.logo} />
          <div>
            <Typography
              variant="h2"
              gutterBottom
              color="inherit"
              style={{
                margin: "1rem 0",
                display: "flex",
                alignItems: "center",
              }}
            >
              {title ? (
                title.toUpperCase()
              ) : (
                <>
                  <span>POKER</span>
                  <span
                    style={{
                      position: "relative",
                      fontSize: "50%",
                    }}
                  >
                    &nbsp;IN&nbsp;
                  </span>
                  <span>PLACE</span>
                </>
              )}
            </Typography>
            <Typography
              variant="h6"
              color="inherit"
              style={{ margin: "1rem 0.5rem" }}
            >
              Play poker while safely social distancing and catching up with
              your friends. Optimized for large screens or tablets.&nbsp;
              <Link
                href="/faq"
                target="_blank"
                style={{ fontSize: "80%", fontWeight: 600 }}
                color="secondary"
              >
                [View FAQ]
              </Link>
            </Typography>
            {user ? (
              <Button
                variant="contained"
                color="secondary"
                style={{ margin: "1rem 0" }}
                onClick={createGame}
                size="large"
                data-pup="create-new-game"
              >
                Create New Game
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                style={{ margin: "1rem 0" }}
                href="/login"
                size="large"
                data-pup="login"
              >
                Get Started
              </Button>
            )}
            <Button
              title="Learn More..."
              style={{
                width: 300,
                position: "absolute",
                bottom: "1rem",
                left: "50%",
                marginLeft: "-150px",
              }}
              onClick={scrollDown}
            >
              Learn More <ArrowDownwardIcon />
            </Button>
          </div>
        </MaterialContainer>
      </FullPage>
      <FullPage
        id="fullPageVideo"
        style={{
          backgroundColor: "#eee",
          color: "#444",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ReactPlayer
          url="https://www.youtube.com/watch?v=0C4W882q81I"
          height={360}
          width={640}
          controls
        />
      </FullPage>
      {/* <FullPage id="fullPageTable">
        <TableContainer>
          <MockTable />
        </TableContainer>
      </FullPage> */}
      <FullPage
        id="fullPageTable"
        style={{ backgroundColor: "#eee", color: "#444" }}
      >
        <Container>
          <MaterialContainer maxWidth="sm" className="about">
            <Typography variant="h5">
              This is a solo-creative project stemming from the shelter-in-place
              directives. Would love any feedback or suggestions. If you feel
              like helping to support the infrastructure costs, I would greatly
              appreciate any donations. Please enjoy!
            </Typography>
            <div className="feedback">
              <Link href="mailto:nick@pokerinplace.app">Send feedback</Link>
              <Link
                href={`https://www.paypal.com/cgi-bin/webscr?&cmd=_donations&business=${encodeURIComponent(
                  "nbclark@gmail.com"
                )}&currency_code=USD&item_name=${encodeURIComponent(
                  `${title} Donation`
                )}`}
                target="_blank"
              >
                Make Donation
              </Link>
              <Link
                data-size="large"
                className="twitter-hashtag-button"
                href={`https://twitter.com/intent/tweet?button_hashtag=pokerinplace&text=${encodeURIComponent(
                  "Just finished playing online video poker with my friends at https://pokerinplace.app! #pokerinplace"
                )}`}
              >
                Tweet #pokerinplace
              </Link>
              {/* <script
                async
                src="https://platform.twitter.com/widgets.js"
              ></script> */}
            </div>
          </MaterialContainer>
        </Container>
      </FullPage>
    </Container>
  );
}

function WrappedHome() {
  return <Home />;
}

export default WrappedHome;
