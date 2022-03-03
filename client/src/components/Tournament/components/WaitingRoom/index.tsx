import React, { memo, useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import VideocamIcon from "@material-ui/icons/Videocam";
import {
  ChevronRight as ChevronRightIcon,
} from "@material-ui/icons";

import { TournamentStatus } from "../../../../engine/types";
import ChatRoom from "../ChatRoom";
import useVideoContext from "../../../../twilio/hooks/useVideoContext/useVideoContext";

import { IWaitingRoomProps } from "./interface";
import TableTileList from "./components/TableTileList";
import VideoZone from "./components/VideoZone";
import Branding from "./components/Branding";

import "./styles.css";

const WaitingRoom = function (props: IWaitingRoomProps) {
  const players = Object.values(props.tournament.players)
    .filter((p) => !p.removed)
    .sort(
      (p1, p2) =>
        (p1.created || Number.MAX_SAFE_INTEGER) -
        (p2.created || Number.MAX_SAFE_INTEGER)
    );

  const [zoomEnded, setZoomEnded] = useState(false);
  const onMessage = (ev: MessageEvent) => {
    if (ev.data && ev.data.zoom) {
      switch (ev.data.zoom) {
      case "ended":
        setZoomEnded(true);
        break;
      default:
        break;
      }
    }
  };
  const [failedVideos, setFailedVideos] = useState<{ [key: string]: number }>(
    {}
  );

  const shouldRenderActionBtn = props.actionMessage && props.shouldRenderActionBtn;

  useEffect(() => {
    if (
      Object.keys(failedVideos).length &&
      props.tournament.status === TournamentStatus.Initialized
    ) {
      const interval = setInterval(() => {
        const timeElapsed = new Date().getTime() - 1000 * 5;
        let needsUpdate = false;
        const updatedMap = Object.keys(failedVideos).reduce((map, key) => {
          const hasChange = failedVideos[key] < timeElapsed;
          needsUpdate = needsUpdate || hasChange;
          console.log({
            hasChange,
            map,
            key,
            time: failedVideos[key],
            timeElapsed,
          });
          return hasChange ? map : { ...map, [key]: failedVideos[key] };
        }, {});
        if (needsUpdate) {
          setFailedVideos(updatedMap);
        }
      }, 1000 * 6);
      return () => clearInterval(interval);
    }
  }, [failedVideos, props.tournament.status]);

  // Reset the zoom connection
  useEffect(() => {
    setZoomEnded(false);
  }, [props.timestamp]);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  const isZoomEmbed =
    !zoomEnded &&
    !props.isOrganizer &&
    props.tournament.externalVideoConferencingLink &&
    props.tournament.externalVideoConferencingLink.indexOf("zoom") >= 0;

  const isActive = props.tournament.status !== TournamentStatus.Initialized;

  return (
    <div
      className={`room-overlay ${isActive ? "active" : ""} ${isZoomEmbed ? "zoom" : ""}`}
    >
      <div className="waiting-room__left">
        <VideoZone
          tournament={props.tournament}
          isOrganizer={props.isOrganizer}
          shouldPauseVideo={props.isWelcomeMessageDialogOpened}
        />
        {isActive && (
          <div className="table-list">
            <TableTileList
              tournament={props.tournament}
              onSelectTable={props.onSelectTable}
            />
          </div>
        )}
        {!isActive && (
          <div className="player-grid-tournament">
            {players.map((player, index) => (
              <div
                data-pup={`player-tile-${player.name}`}
                key={player.id}
                style={{ backgroundImage: `url(${player.photoURL})` }}
                className={player.arrived ? "arrived" : "missing"}
                onMouseOver={() => {
                  const video = document.getElementById(
                    `player-video-${index}`
                  ) as HTMLVideoElement;
                  if (video) {
                    video.style.display = "block";
                    try {
                      video.play();
                    } catch (e) { }
                  }
                }}
                onMouseLeave={() => {
                  const video = document.getElementById(
                    `player-video-${index}`
                  ) as HTMLVideoElement;
                  if (video) {
                    try {
                      video.currentTime = 0;
                      video.pause();
                    } catch (e) { }
                    video.style.display = "none";
                  }
                }}
              >
                <div style={{ position: "relative" }}>
                  {player.welcomeMessageUrl && !failedVideos[player.id] ? (
                    <span className="player-has-video">
                      <VideocamIcon />
                    </span>
                  ) : null}
                  <span className="player-index">#{index + 1}</span>
                  <span>{player.name}</span>
                  {player.welcomeMessageUrl && !failedVideos[player.id] ? (
                    <video
                      id={`player-video-${index}`}
                      playsInline
                      loop
                      style={{
                        display: "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        transform: "scaleX(-1)",
                        objectFit: "cover",
                        height: "100%",
                      }}
                    >
                      <source
                        src={`${
                          player.welcomeMessageUrl
                        }?${new Date().getTime()}`}
                        onError={() => {
                          setFailedVideos({ [player.id]: new Date().getTime() });
                        }}
                        type="video/mp4"
                      />
                    Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="waiting-room__right">
        <Branding tournament={props.tournament} />
        <ChatRoom
          tournament={props.tournament}
          currentUserId={props.currentUserId}
          isOrganizer={props.isOrganizer}
          allowEmbeddedVideo={!zoomEnded}
        />

        {shouldRenderActionBtn && (
          <div className="action-button">
            <Button
              type="submit"
              color="primary"
              variant="contained"
              onClick={props.onActionClicked}
              size="large"
              data-pup="tournament-primary-action"
            >
              {props.actionMessage} <ChevronRightIcon />
            </Button>
          </div>
        )
        }
      </div>

      {props.waitingMessage && (
        <div className="waiting-message">
          <div>{props.waitingMessage}</div>
        </div>
      )}
    </div>
  );
}

export default memo(WaitingRoom);