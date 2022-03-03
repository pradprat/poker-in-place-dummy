/* eslint-disable react/no-unescaped-entities */
import React, { useEffect } from "react";
import {
  Button,
  Theme,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from "@material-ui/core";
import { styled, createStyles, makeStyles } from "@material-ui/core/styles";
import Div100vh from "react-div-100vh";
import { useHistory } from "react-router-dom";
import { LocalAudioTrack, LocalVideoTrack } from "twilio-video";

import AudioInputList from "../../twilio/components/MenuBar/DeviceSelector/AudioInputList/AudioInputList";
import AudioOutputList from "../../twilio/components/MenuBar/DeviceSelector/AudioOutputList/AudioOutputList";
import VideoInputList from "../../twilio/components/MenuBar/DeviceSelector/VideoInputList/VideoInputList";
import { useDevices } from "../../twilio/components/MenuBar/DeviceSelector/deviceHooks/deviceHooks";
import useLocalTracks from "../../twilio/components/VideoProvider/useLocalTracks/useLocalTracks";
import Header from "../Header";
import { MiscOverrides } from "../../theme";

const miscOverrides = MiscOverrides[window.location.hostname];
const title =
  miscOverrides && miscOverrides.title ? miscOverrides.title : "Poker-in-Place";

const Container = styled(Div100vh)({
  display: "flex",
  flexDirection: "column",
  // height: "100vh",
  overflow: "hidden",
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    container: {
      maxWidth: "800px",
      width: "80vw",
      margin: "auto",
      marginTop: theme.spacing(2),
      "& h2": {
        margin: theme.spacing(1),
      },
      display: "flex",
      flexDirection: "column",
      justifyContent: "stretch",
      alignItems: "stretch",
    },
    listSection: {
      margin: "1em 0",
    },
    paper: {
      [theme.breakpoints.down("xs")]: {
        margin: "16px",
      },
    },
    stepperContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "stretch",
      alignItems: "stretch",
    },
    stepperActions: {
      marginTop: theme.spacing(3),
    },
    marginlessLabel: {
      marginLeft: 0,
      marginRight: 0,
    },
    button: {
      marginRight: theme.spacing(1),
    },
    instructions: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    card: {
      "&>div:last-child": {
        marginTop: 0,
        alignSelf: "center",
      },
    },
    next: {
      marginRight: 0,
      float: "right",
    },
    back: {
      marginLeft: 0,
    },
    paddedPaper: {
      padding: theme.spacing(2),
    },
    mediaButton: {
      margin: "5vh 0",
    },
    stepperContainer: {
      padding: "1rem",
      marginTop: "1rem",
    },
  })
);

function getUrlVars() {
  return new URLSearchParams(window.location.search.slice(1));
}

function getSteps() {
  return ["Enable Audio/Video", "Configure Options", "Check Connection"];
}

function Configure() {
  const classes = useStyles();
  const redirectURI = getUrlVars().get("redirectURI") || "/";
  const history = useHistory();
  const [activeStep, setActiveStep] = React.useState(0);
  const [waitForDevices, setWaitForDevices] = React.useState(false);
  const [skipped, setSkipped] = React.useState(new Set());
  const [apiEnabled, setApiEnabled] = React.useState(false);
  const [apiError, setApiError] = React.useState("");
  const { devices, forceAcceptPermissions } = useDevices();
  const { getAudioAndVideoTracks, removeLocalVideoTrack, removeLocalAudioTrack, localTracks } = useLocalTracks();

  const onDone = React.useCallback(() => {
    history.push(redirectURI);
  }, [history, redirectURI]);

  const onEnableMediaPermissions = () => {
    setWaitForDevices(true);
    forceAcceptPermissions();
  };

  const onTestAPIConnection = async () => {
    try {
      const result = await fetch(
        `${process.env.REACT_APP_API_ENDPOINT}/health`
      );
      if (result) {
        setApiEnabled(true);
        setApiError(null);
      } else {
        setApiError("Unknown error");
      }
    } catch (e) {
      setApiEnabled(false);
      setApiError(e.message);
    }
  };

  const localVideoTrack = localTracks.find((track) => track.kind === "video") as LocalVideoTrack;
  const localAudioTrack = localTracks.find((track) => track.kind === "audio") as LocalAudioTrack;

  useEffect(() => {
    if (waitForDevices && devices.length) {
      setTimeout(() => {
        setActiveStep(1);
      }, 2000);
    }
  }, [waitForDevices, devices]);

  useEffect(() => {
    if (!localTracks.length) {
      getAudioAndVideoTracks();
    }

    if (activeStep === 2) {
      removeLocalVideoTrack();
      removeLocalAudioTrack();
    }
  }, [activeStep]);

  function getStepContent(step: number) {
    switch (step) {
    case 0:
      return (
        <div>
          <h2>Enable Media Permissions</h2>
          <Typography>
              To get started, we'll need to grant webcam and microphone accees.
              Click the button below, and then accept the permissions pop-up in
              the browser. When done, click next.
          </Typography>
          <Button
            onClick={onEnableMediaPermissions}
            variant="outlined"
            color="secondary"
            size="large"
            className={classes.mediaButton}
          >
              Enable Video/Audio
          </Button>
          {!!devices?.length && (
            <Typography>
                Great! Audio/Video are enabled. Now we'll let you configure
                them.
            </Typography>
          )}
        </div>
      );
    case 1:
      return (
        <div>
          <div className={classes.listSection}>
            <AudioInputList localAudioTrack={localAudioTrack} />
          </div>
          <div className={classes.listSection}>
            <AudioOutputList />
          </div>
          <div className={classes.listSection}>
            <VideoInputList localVideoTrack={localVideoTrack} />
          </div>
        </div>
      );
    case 2:
      return (
        <div>
          <div className={classes.listSection}>
            <h2>Configure Connectivity</h2>
            {apiError ? (
              <div>
                <h3>Error connecting to the API</h3>
                <div>{apiError}</div>
                <div>
                  <h3>Error connecting to the API</h3>
                  <div>{apiError}</div>
                  <div>
                    <ul>
                      <li>Do you have an ad-blocker enabled?</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
            <Button
              onClick={onTestAPIConnection}
              variant="outlined"
              color="secondary"
              size="large"
              className={classes.mediaButton}
              disabled={apiEnabled}
            >
                Test API Connection
            </Button>
            {apiEnabled ? (
              <div>
                <h4>Looks Good! You've got video and internet configured. Let's play.</h4>
              </div>
            ) : null}
          </div>
        </div>
      );
    default:
      return <div>Unknown step</div>;
    }
  }

  const isStepOptional = (step: number) => step === -1;

  const isStepSkipped = (step: number) => false;

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onDone();
      return;
    }

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const isNextStepEnabled = () => {
    if (activeStep === 0) {
      return !!devices.length;
    } if (activeStep === 2) {
      return apiEnabled;
    }
    return true;
  };

  let nextButtonTitle = "Next";

  const steps = getSteps();

  if (activeStep === steps.length - 1) {
    nextButtonTitle = "Let's Play!";
  }

  return (
    <Container>
      <Header
        title={title}
        renderVideoControls
        drawerItems={null}
        mobileModeEnabled
      />
      <div className={classes.container}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => {
            const stepProps: { completed: boolean } = {
              completed: activeStep > index,
            };
            const labelProps: { optional?: any } = {};
            if (isStepOptional(index)) {
              labelProps.optional = (
                <Typography variant="caption">Optional</Typography>
              );
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <div className={classes.stepperContainer}>
          <div className={classes.stepperContent}>
            <Typography className={classes.instructions} component="div">
              {getStepContent(activeStep)}
            </Typography>
            <div className={classes.stepperActions}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={`${classes.button} ${classes.back}`}
              >
                Back
              </Button>
              {isStepOptional(activeStep) && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSkip}
                  className={classes.button}
                >
                  Skip
                </Button>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                className={`${classes.button} ${classes.next}`}
                disabled={!isNextStepEnabled()}
                data-pup="creategameflow-next"
              >
                {nextButtonTitle}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Configure;
