import React, { useCallback, useEffect } from "react";
import Button from "@material-ui/core/Button";
import { makeStyles, createStyles, Theme } from "@material-ui/core";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import CheckCircleIcon from "@material-ui/icons/Check";
import ReplayIcon from "@material-ui/icons/Replay";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";

import useLocalTracks from "../../twilio/components/VideoProvider/useLocalTracks/useLocalTracks";

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

interface IRecorder {
  record: { (): void };
  upload: { (): void };
  reset: { (hardReset: boolean): void };
  stopVideo?: { (): void };
  playVideo?: { (): void };
  pauseVideo?: { (): void };
  accept?: { (): void };
  remove: { (): void };
}

enum RecorderState {
  Idle,
  Recording,
  Recorded,
  Playing,
  Paused,
  Accepted,
  Uploading,
  Uploaded,
}

export function usePipeSDK(
  videoRefCurrent: HTMLDivElement,
  {
    width = 480,
    height = 510,
    maxRecordingDuration = 10,
    allowUploads = false,
  }: {
    width: number;
    height: number;
    maxRecordingDuration: number;
    allowUploads: boolean;
  },
  qualityUrl = "avq/480p.xml"
) {
  const ACCOUNT_HASH = "7de8db5e13e2cb71b0b40bd54fbc4a66";
  const [videoUrl, setVideoUrl] = React.useState("");
  const [recorderVisible, setRecorderVisible] = React.useState(false);
  const [defaultRecorder] = React.useState({
    record: () => {
      document.getElementById("pipeStartRecording-custom-id").click();
    },
    upload: () => {
      document.getElementById("pipeStartUploading-custom-id").click();
    },
    reset: (hardReset: boolean) => {
      setRecorderState(RecorderState.Idle);
    },
    accept: () => {
      setRecorderState(RecorderState.Accepted);
      setRecorderVisible(false);
    },
    remove: () => {
    },
  });
  const [recorder, setRecorder] = React.useState<IRecorder>(defaultRecorder);
  const [recordStartTime, setRecordStartTime] = React.useState<number>(0);
  const [recorderState, setRecorderState] = React.useState<RecorderState>(
    RecorderState.Idle
  );
  const [recordDuration, setRecordDuration] = React.useState<number>(0);
  const [recordRemaining, setRecordRemaining] = React.useState<number>(0);
  const [hasLoadedRecorder, setHasLoadedRecorder] = React.useState(false);
  const { removeLocalVideoTrack } = useLocalTracks();

  React.useLayoutEffect(() => {
    if (videoRefCurrent && width && !hasLoadedRecorder) {
      setHasLoadedRecorder(true);
      const pipeParams = {
        size: { width, height },
        qualityurl: qualityUrl,
        accountHash: ACCOUNT_HASH,
        eid: "Bmzg3f",
        mrt: maxRecordingDuration,
        ssb: 1,
        asv: 1,
        mv: 1,
        st: 1,
        sis: allowUploads ? 0 : 1,
        dup: allowUploads ? 1 : 0,
        showMenu: false,
      };
      // @ts-ignore
      global.PipeSDK.insert(
        videoRefCurrent.id,
        pipeParams,
        (recorderObject: any) => {
          let interval: NodeJS.Timeout = null;
          // eslint-disable-next-line no-param-reassign
          recorderObject.onReadyToRecord = function (id: any, type: any) {
            const recorderObj = {
              record: () => {
                const startTime = new Date().getTime();
                setRecordStartTime(startTime);
                recorderObject.stopVideo();
                recorderObject.record();
                setRecorderState(RecorderState.Recording);
                interval = setInterval(() => {
                  const duration = (new Date().getTime() - startTime) / 1000;
                  const timeRemaining = maxRecordingDuration - duration;
                  if (timeRemaining <= 0.05) {
                    recorderObj.stopVideo();
                  }
                  setRecordDuration(duration);
                  setRecordRemaining(timeRemaining);
                }, 50);
              },
              stopVideo: () => {
                clearInterval(interval);
                recorderObject.stopVideo();
                setRecorderState(RecorderState.Recorded);
                setTimeout(() => {
                  recorderObj.playVideo();
                  recorderObj.pauseVideo();
                }, 250);
              },
              playVideo: () => {
                recorderObject.playVideo();
                setRecorderState(RecorderState.Playing);
              },
              pauseVideo: () => {
                recorderObject.pause();
                setRecorderState(RecorderState.Paused);
              },
              upload: () => {
                document.getElementById("pipeStartUploading-custom-id").click();
              },
              accept: () => {
                setRecorderState(RecorderState.Accepted);
                setRecorderVisible(false);
              },
              reset: (hardReset: boolean) => {
                setRecorderState(RecorderState.Idle);
                setRecorder(defaultRecorder);
                setHasLoadedRecorder(false);
                const node = document.getElementById("pipeRecordRTC-custom-id");
                if (hardReset && node) {
                  node.parentNode.removeChild(node);
                }
              },
              remove: () => {
                recorderObject.remove();
                removeLocalVideoTrack();
              }
            };
            setRecorder(recorderObj);
          };
          // onRecordingStarted
          // eslint-disable-next-line no-param-reassign
          recorderObject.onDesktopVideoUploadStarted = function (
            recorderId: string,
            filename: string,
            filetype: string,
            audioOnly: boolean
          ) {
            setRecorderState(RecorderState.Uploading);
          };

          // eslint-disable-next-line no-param-reassign
          recorderObject.onUploadDone = function (
            recorderId: string,
            streamName: string,
            streamDuration: number,
            audioCodec: string,
            videoCodec: string,
            fileType: string,
            audioOnly: boolean,
            location: string
          ) {
            const url = `https://${location}/${ACCOUNT_HASH}/${streamName}.mp4`;
            setVideoUrl(url);
          };
          // eslint-disable-next-line no-param-reassign
          recorderObject.onDesktopVideoUploadSuccess = function (
            recorderId: string,
            fileName: string,
            filetype: string,
            videoId: string,
            audioOnly: string,
            location: string
          ) {
            const url = `https://${location}/${ACCOUNT_HASH}/${fileName}.mp4`;
            setVideoUrl(url);
            setRecorderState(RecorderState.Uploaded);
          };
          setRecorderVisible(true);
        }
      );
    }
  }, [videoRefCurrent, width, setHasLoadedRecorder]);

  return {
    videoUrl,
    setVideoUrl,
    recorderVisible,
    recorder,
    recordDuration,
    recorderState,
    recordRemaining,
    isShowingLoadingScreen: defaultRecorder === recorder,
  };
}

export function VideoRecorder({
  show,
  className,
  message,
  onVideoAccepted,
  qualityUrl,
  width,
  height,
  maxRecordingDuration,
  allowUploads = false,
}: {
  show: boolean;
  className: string;
  message: string;
  onVideoAccepted: { (videoUrl: string): void };
  qualityUrl?: string;
  width?: number;
  height?: number;
  maxRecordingDuration?: number;
  allowUploads?: boolean;
}) {
  const classes = useStyles();
  const videoRef = React.useRef<HTMLDivElement>();
  const [showVideoRecorder, setShowVideoRecorder] = React.useState(show);
  const scaledWidth =
    showVideoRecorder && videoRef?.current?.parentElement?.clientWidth
      ? Math.min(videoRef?.current?.parentElement?.clientWidth || 640, 640)
      : 0;

  const scaledHeight = height || ((width || scaledWidth) * 9) / 16 + 30;
  const {
    videoUrl,
    recorderVisible,
    recorder,
    recorderState,
    recordRemaining,
    isShowingLoadingScreen,
  } = usePipeSDK(
    videoRef.current,
    {
      width: width || scaledWidth,
      height: scaledHeight,
      maxRecordingDuration: maxRecordingDuration || 10,
      allowUploads,
    },
    qualityUrl
  );

  const handleAcept = useCallback(() => {
    recorder.accept();
    setShowVideoRecorder(false);
    recorder.reset(true);
    onVideoAccepted(videoUrl);
  }, [videoUrl]);

  useEffect(() => () => {
    if (recorderVisible) {
      recorder.remove()
    }
  }, [recorder, recorderVisible]);

  return (
    <div
      className={`record-video ${className} ${classes.container}`}
      style={{ position: "relative", minHeight: scaledHeight }}
    >
      <div
        id="custom-id"
        ref={videoRef}
        style={{
          display: showVideoRecorder ? "flex" : "none",
        }}
      />
      {recorderVisible ? (
        <>
          <div
            className={classes.buttons}
            style={{ top: isShowingLoadingScreen ? 0 : "unset" }}
          >
            {(recorderState === RecorderState.Idle ||
              recorderState === RecorderState.Playing ||
              recorderState === RecorderState.Paused) && (
              <Button
                onClick={recorder.record}
                className={classes.record}
                startIcon={<FiberManualRecordIcon />}
              >
                Record
              </Button>
            )}
            {allowUploads && recorderState === RecorderState.Idle && (
              <Button
                onClick={recorder.upload}
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
            {recorderState === RecorderState.Recording && (
              <Button
                onClick={recorder.stopVideo}
                startIcon={<StopIcon />}
              >
                Stop
              </Button>
            )}
            {(recorderState === RecorderState.Recorded ||
              recorderState === RecorderState.Paused) && (
              <Button
                onClick={recorder.playVideo}
                startIcon={<PlayCircleOutlineIcon />}
              >
                Play
              </Button>
            )}
            {(recorderState === RecorderState.Uploaded ||
              recorderState === RecorderState.Recorded ||
              recorderState === RecorderState.Playing ||
              recorderState === RecorderState.Paused) && (
              <Button
                onClick={handleAcept}
                startIcon={<CheckCircleIcon />}
              >
                Accept
              </Button>
            )}
            {recorderState === RecorderState.Recorded && (
              <Button
                onClick={() => {
                  recorder.reset(true);
                }}
                startIcon={<ReplayIcon />}
              >
                Play
              </Button>
            )}
          </div>
          {recorderState === RecorderState.Recording && (
            <div className={classes.time}>{recordRemaining.toFixed(2)}</div>
          )}
        </>
      ) : null}
      <Button
        type="submit"
        color="primary"
        variant="contained"
        onClick={() => {
          setShowVideoRecorder(true);
          recorder?.reset(false);
        }}
        className="button"
        size="small"
        style={{ display: !showVideoRecorder ? "flex" : "none" }}
      >
        {message}
      </Button>
    </div>
  );
}
