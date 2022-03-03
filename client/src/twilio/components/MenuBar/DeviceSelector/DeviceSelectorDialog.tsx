import React, { useEffect, useState } from "react";

import AudioInputList from "./AudioInputList/AudioInputList";
import AudioOutputList from "./AudioOutputList/AudioOutputList";
import VideoInputList from "./VideoInputList/VideoInputList";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Theme,
  CircularProgress,
} from "@material-ui/core";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import useLocalTracks from "../../VideoProvider/useLocalTracks/useLocalTracks";
import { LocalAudioTrack, LocalVideoTrack } from "twilio-video";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      width: "500px",
      [theme.breakpoints.down("xs")]: {
        width: "calc(100vw - 32px)",
      },
      "& .inputSelect": {
        width: "calc(100% - 35px)",
      },
    },
    listSection: {
      margin: "1em 0",
    },
    button: {
      float: "right",
    },
    paper: {
      [theme.breakpoints.down("xs")]: {
        margin: "16px",
      },
    },
    circularProgress: {
      display: "block",
      margin: "auto",
    }
  })
);

interface IProps {
  open: boolean;
  onClose: () => void;
  closeText?: string;
}

export function DeviceSelectorDialog(props: IProps) {
  const [isLoading, setIsLoading] = useState(true);
  const classes = useStyles();
  const { getAudioAndVideoTracks, removeLocalVideoTrack, removeLocalAudioTrack, localTracks } = useLocalTracks();

  useEffect(() => {
    if (props.open) {
      getAudioAndVideoTracks().then(() => {
        if (localTracks.length) {
          setIsLoading(false);
        }
      });
    }
  }, [props.open, getAudioAndVideoTracks]);

  const handleClose = () => {
    removeLocalVideoTrack()
    removeLocalAudioTrack()
    setIsLoading(true)
    props.onClose();
  }

  const localVideoTrack = localTracks.find((track) => track.kind === "video") as LocalVideoTrack;
  const localAudioTrack = localTracks.find((track) => track.kind === "audio") as LocalAudioTrack;

  return (
    <>
      <Dialog
        open={props.open}
        onClose={handleClose}
        classes={{ paper: classes.paper }}
      >
        <DialogTitle id="form-dialog-title">Configure Audio/Video</DialogTitle>
        <DialogContent className={classes.container}>
          <DialogContentText component="div">
            Before the game begins, let's make sure your audio/video are
            configured correctly. The microphone should light up as you talk. If
            it is not, please select a different input device.
          </DialogContentText>
          {isLoading && <CircularProgress className={classes.circularProgress} disableShrink />}
          {!isLoading && (
            <React.Fragment>
              <div className={classes.listSection}>
                <AudioInputList localAudioTrack={localAudioTrack} />
              </div>
              <div className={classes.listSection}>
                <AudioOutputList />
              </div>
              <div className={classes.listSection}>
                <VideoInputList localVideoTrack={localVideoTrack} />
              </div>
            </React.Fragment>
            )
          }
          <Button className={classes.button} onClick={handleClose}>
            {props.closeText || "Done"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
