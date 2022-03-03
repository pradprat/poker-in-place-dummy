import React, { useLayoutEffect } from "react";

import { RecorderState, IRecorder } from "./interface";

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
  const [recorderState, setRecorderState] = React.useState<RecorderState>(
    RecorderState.Idle
  );
  const [recordDuration, setRecordDuration] = React.useState<number>(0);
  const [recordRemaining, setRecordRemaining] = React.useState<number>(0);
  const [hasLoadedRecorder, setHasLoadedRecorder] = React.useState(false);

  useLayoutEffect(() => {
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
          recorderObject.onReadyToRecord = function (id: any, type: any) {
            const recorderObj = {
              record: () => {
                setRecordDuration(0);
                const startTime = new Date().getTime();
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
                recorderObject.save();
                setRecorderState(RecorderState.Recorded);
              },
              playVideo: () => {
                recorderObject.playVideo();
                setRecorderState(RecorderState.Playing);
              },
              pauseVideo: () => {
                recorderObject.pause();
                setRecorderState(RecorderState.Paused);
              },
              upload: () => { },
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
              }
            };
            setRecorder(recorderObj);
          };
          // onRecordingStarted
          // @ts-ignore
          recorderObject.onDesktopVideoUploadStarted = function () {
            setRecorderState(RecorderState.Uploading);
          };

          recorderObject.onPlaybackComplete = function () {
            setRecorderState(RecorderState.Paused);
          }

          // @ts-ignore
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
          // @ts-ignore
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
  }, [
    videoRefCurrent, width, setHasLoadedRecorder,
    hasLoadedRecorder, height, qualityUrl,
    maxRecordingDuration, allowUploads, defaultRecorder
  ]);

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