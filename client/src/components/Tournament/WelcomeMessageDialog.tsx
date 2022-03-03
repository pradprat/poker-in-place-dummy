import React, { PropsWithChildren } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import { makeStyles, createStyles, Theme } from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";

import { VideoRecorder } from "./hooks";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    recordVideo: {
      width: 480,
      height: 480 + 30,
      maxWidth: "90vw",
      maxHeight: "90vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    description: {
      width: 480,
      maxWidth: "90vw",
    },
  })
);

interface WelcomeDialogProps {
  open: boolean;
  onClose(videoUrl?: string): void;
}

function WelcomeMessageDialog({
  open,
  onClose,
}: PropsWithChildren<WelcomeDialogProps>) {
  const classes = useStyles();
  const [videoUrl, setVideoUrl] = React.useState("");
  const onVideoAccepted = React.useCallback((videoUrl: string) => {
    setVideoUrl(videoUrl);
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl">
      <DialogTitle>Record Your Welcome Video</DialogTitle>
      <DialogContent>
        <div className={classes.description}>
          {!videoUrl
            ? `Click below to record a welcome video to be shared with your profile
                    in the lobby. This is a great way to say hi and make your presence
                    known!`
            : `Great! Preview the video, type a message, and click send to post
                    the video.`}
        </div>
        <div className={`record-video ${classes.recordVideo}`}>
          <VideoRecorder
            message="Upload a Welcome Message"
            show
            className=""
            onVideoAccepted={onVideoAccepted}
            qualityUrl={`${document.location.origin}/files/480x480.xml`}
            width={480}
            height={480}
            maxRecordingDuration={10}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="default" autoFocus>
          Decline
        </Button>
        <Button
          onClick={() => onClose(videoUrl)}
          color="primary"
          autoFocus
          disabled={!videoUrl}
        >
          Post Video
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WelcomeMessageDialog;
