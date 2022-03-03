import React, { memo, FunctionComponent, useCallback, useState } from "react";
import ReactPlayer from "react-player";

import { callFirebaseTournamentFunctionWithJson } from "../../../../../../firebase/rest";
import { useAppState } from "../../../../../../twilio/state";
import { useSessionRecording } from "../../../../../SessionRecordingProvider";
import { VideoManager } from "../VideoManager";

import { IVideoZoneProps } from "./interface";

import "./styles.css";

const VideoZone: FunctionComponent<IVideoZoneProps> = ({ isOrganizer, tournament, shouldPauseVideo }) => {
  const [hideVideo, setHideVideo] = useState(false);
  const { user } = useAppState();
  const { tracker } = useSessionRecording();

  const { welcomeVideoUrl, vimeoVideoUrl, hasVimeoEnabled, isWelcomeVideoLoaded } = tournament.branding;
  const hasWelcomeVideo = !!welcomeVideoUrl;
  const hasVimeo = !!vimeoVideoUrl;
  const shouldRenderConvertMsg = isOrganizer && !hideVideo && !hasVimeoEnabled && welcomeVideoUrl && !isWelcomeVideoLoaded
  const shouldRenderVideoPlayer = !hideVideo && ((welcomeVideoUrl && isWelcomeVideoLoaded) || (vimeoVideoUrl && hasVimeoEnabled));

  const handleShowUploader = useCallback(() => {
    setHideVideo(true);
  }, []);

  const handleCloseUploader = useCallback(() => {
    setHideVideo(false);
  }, [])

  const onVideoAccepted = (videoUrl: string) => {
    callFirebaseTournamentFunctionWithJson(
      "tournament/update",
      {
        id: tournament.id,
        branding: {
          ...tournament.branding,
          welcomeVideoUrl: videoUrl
        }
      },
      () => user!.getIdToken(),
      () => tournament?.apiServerHost,
      tournament.id,
      null,
      tracker,
      0,
      "PUT"
    );

    setHideVideo(false);
  };

  const toggleVimeo = () => {
    callFirebaseTournamentFunctionWithJson(
      "tournament/update",
      {
        id: tournament.id,
        branding: {
          ...tournament.branding,
          hasVimeoEnabled: !hasVimeoEnabled,
        }
      },
      () => user!.getIdToken(),
      () => tournament?.apiServerHost,
      tournament.id,
      null,
      tracker,
      0,
      "PUT"
    );
  }

  return (
    <div className="video-zone-container">
      {isOrganizer && (
        <VideoManager
          allowUploads
          onVideoAccepted={onVideoAccepted}
          hasVimeo={hasVimeo}
          hasVimeoEnabled={hasVimeoEnabled}
          toggleVimeo={toggleVimeo}
          hasWelcomeVideo={hasWelcomeVideo}
          onShowUploader={handleShowUploader}
          onCloseUploader={handleCloseUploader}
        />
      )}
      {shouldRenderConvertMsg && (
        <p className="video-zone-container__msg">The uploaded video is being converted. It will be enabled automatically in case Vimeo isn’t streaming.</p>
      )}
      {shouldRenderVideoPlayer && (
        <div className="player-wrapper">
          <ReactPlayer
            className="react-player"
            url={hasVimeoEnabled ? vimeoVideoUrl : welcomeVideoUrl}
            width="100%"
            height="100%"
            controls
            playing={!shouldPauseVideo}
          />
        </div>
      )}
    </div>
  )
}

export default memo(VideoZone);