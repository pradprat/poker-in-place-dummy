import React, { memo, useState, useRef, useCallback, FunctionComponent, useEffect } from "react";
import Button from "@material-ui/core/Button";
import { makeStyles, createStyles, Theme } from "@material-ui/core";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import CheckCircleIcon from "@material-ui/icons/Check";
import ReplayIcon from "@material-ui/icons/Replay";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import PauseOutlinedIcon from "@material-ui/icons/PauseOutlined";

import { usePipeSDK } from "./utils";
import { RecorderState, IVideoManagerProps } from "./interface";
import "./styles.css"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      "& .pipeRecordRTC > span": {
        display: "none",
      },
      "& .pipeUploadAnother": {
        display: "none !important",
      },
    },
    time: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      textAlign: "center",
      margin: "auto",
      backgroundColor: "rgba(0, 0, 0, 0.25)",
      color: "white",
      fontWeight: 600,
      zIndex: 1000,
    },
    buttons: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "auto",
      borderRadius: 8,
      zIndex: 1000,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      "& svg": {
        width: "3rem",
        height: "3rem",
        color: theme.palette.primary.main,
        backgroundColor: "white",
        borderRadius: "5rem",
        overflow: "hidden",
        "&:hover": {
          color: "black",
        },
      },
      "& .MuiButton-label": {
        flexDirection: "column",
        justifyContent: "center",
        color: "black",
      },
      "& .MuiButton-label .MuiButton-startIcon": {
        margin: "0 !important",
      },
    },
    record: {
      "& svg": {
        color: "red !important",
      },
    },
  })
);

const VideoManagerComponent: FunctionComponent<IVideoManagerProps> = ({
  onVideoAccepted,
  qualityUrl,
  allowUploads = false,
  hasWelcomeVideo = false,
  hasVimeoEnabled = false,
  hasVimeo = false,
  toggleVimeo,
  onShowUploader,
  onCloseUploader,
}) => {
  const classes = useStyles();
  const videoRef = useRef<HTMLDivElement>();
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  const scaledWidth =
    showVideoRecorder && videoRef?.current?.parentElement?.clientWidth
      ? Math.min(videoRef?.current?.parentElement?.clientWidth || 640, 640)
      : 0;
  const scaledHeight = scaledWidth * 9 / 16;
  const {
    videoUrl,
    recorderVisible,
    recorder,
    recorderState,
    recordRemaining,
    isShowingLoadingScreen,
    recordDuration,
  } = usePipeSDK(
    videoRef.current,
    {
      width: scaledWidth,
      height: scaledHeight,
      maxRecordingDuration: 60,
      allowUploads,
    },
    qualityUrl
  );

  const handleUploadMessage = useCallback(() => {
    setShowVideoRecorder(true);
    recorder?.reset(false);
    onShowUploader();
  }, [onShowUploader, recorder]);
  const handleCloseRecorder = useCallback(() => {
    setShowVideoRecorder(false);
    recorder?.reset(false);
    onCloseUploader();
  }, [onCloseUploader, recorder]);
  const handleToggleVimeo = useCallback(() => toggleVimeo(), [toggleVimeo])

  const shouldRenderRecord = [RecorderState.Idle, RecorderState.Paused, RecorderState.Recorded].includes(recorderState);
  const shouldRenderUpload = allowUploads && isShowingLoadingScreen && recorderState === RecorderState.Idle;
  const shouldRenderStop = recorderState === RecorderState.Recording && recordDuration >= 3;
  const shouldRenderPlay = [RecorderState.Recorded, RecorderState.Paused].includes(recorderState);
  const shouldRenderPause = recorderState === RecorderState.Playing;
  const shouldRenderAccept = [RecorderState.Uploaded, RecorderState.Recorded, RecorderState.Playing, RecorderState.Paused].includes(recorderState)
  const shouldRenderReset = (recorderState !== RecorderState.Recording && recorderState !== RecorderState.Idle);

  useEffect(() => () => {
    if (recorderVisible) {
      recorder.remove()
    }
  }, [recorder, recorderVisible]);
  return (
    <div className="video-manager-container">
      <div className="buttons-container">
        {!hasWelcomeVideo && !showVideoRecorder && (
          <Button
            type="submit"
            color="primary"
            variant="contained"
            onClick={handleUploadMessage}
            size="small"
            className="welcomeMessageBtn"
          >
            Upload a Welcome Message
          </Button>
        )}
        {showVideoRecorder && (
          <Button
            type="submit"
            color="primary"
            variant="contained"
            onClick={handleCloseRecorder}
            size="small"
            className="welcomeMessageBtn"
          >
            Close Welcome Message upload
          </Button>
        )}
        {hasVimeo && (
          <Button
            type="submit"
            color="primary"
            variant="contained"
            onClick={handleToggleVimeo}
            size="small"
          >
            {hasVimeoEnabled ? "Disable" : "Enable"} Vimeo stream
          </Button>
        )}
      </div>
      <div
        className={`record-video ${classes.container}`}
        style={{ position: "relative", minHeight: scaledHeight }}
      >
        <div
          id="custom-id"
          ref={videoRef}
          className="record-video__recorder"
          style={{
            display: showVideoRecorder ? "flex" : "none",
            justifyContent: "center"
          }}
        />
        {showVideoRecorder && recorderVisible && (
          <>
            <div
              className={classes.buttons}
              style={{
                top: isShowingLoadingScreen ? 0 : "unset",
                width: scaledWidth
              }}
            >
              {shouldRenderRecord && (
                <Button
                  onClick={() => recorder.record()}
                  className={classes.record}
                  startIcon={<FiberManualRecordIcon />}
                >
                  Record
                </Button>
              )}
              {shouldRenderUpload && (
                <Button
                  onClick={() => recorder.upload()}
                  startIcon={<CloudUploadIcon />}
                >
                  Upload
                </Button>
              )}
              {recorderState === RecorderState.Uploading && (
                <Button onClick={() => { }} startIcon={<HourglassEmptyIcon />}>
                  Uploading...
                </Button>
              )}
              {shouldRenderStop && (
                <Button
                  onClick={() => recorder.stopVideo()}
                  startIcon={<StopIcon />}
                >
                  Stop
                </Button>
              )}
              {shouldRenderPlay && (
                <Button
                  onClick={() => recorder.playVideo()}
                  startIcon={<PlayCircleOutlineIcon />}
                >
                  Play
                </Button>
              )}
              {shouldRenderPause && (
                <Button
                  onClick={() => recorder.pauseVideo()}
                  startIcon={<PauseOutlinedIcon />}
                >
                  Pause
                </Button>
              )}
              {shouldRenderAccept && (
                <Button
                  onClick={() => {
                    recorder.accept();
                    setShowVideoRecorder(false);
                    recorder.reset(true);
                    onVideoAccepted(videoUrl);
                  }}
                  startIcon={<CheckCircleIcon />}
                >
                  Accept
                </Button>
              )}
              {shouldRenderReset && (
                <Button
                  onClick={() => {
                    recorder.reset(true);
                  }}
                  startIcon={<ReplayIcon />}
                >
                  Reset
                </Button>
              )}
            </div>
            {recorderState === RecorderState.Recording && (
              <div
                className={classes.time}
                style={{
                  width: scaledWidth
                }}
              >
                {recordRemaining.toFixed(2)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const VideoManager = memo(VideoManagerComponent);