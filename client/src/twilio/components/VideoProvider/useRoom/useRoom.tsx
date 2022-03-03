import { Callback } from "../../../types";
import { EventEmitter } from "events";
import { isMobile } from "../../../utils";
import Video, { ConnectOptions, LocalTrack, SuperRoom } from "twilio-video";
import { useCallback, useEffect, useRef, useState } from "react";

import RoomClient from "../../../../mediasoup/RoomClient";
import deviceInfo from "../../../../mediasoup/deviceInfo";
import { ensureMediaPermissions } from "../../../utils";
import useAVConfirmDialog from "../../../../components/AVConfirmDialog/useAVConfirmDialog";

// @ts-ignore
window.TwilioVideo = Video;

function parseJwt(token: string) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

export default function useRoom(
  localTracks: LocalTrack[],
  onError: Callback,
  options?: ConnectOptions
) {
  const [room, setRoom] = useState<SuperRoom>(new EventEmitter() as SuperRoom);
  const [isConnecting, setIsConnecting] = useState(false);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const roomRef = useRef<SuperRoom>(room);
  const { confirm, cancelConfirm, setError } = useAVConfirmDialog();

  roomRef.current = room;

  useEffect(() => {
    // It can take a moment for Video.connect to connect to a room. During this time, the user may have enabled or disabled their
    // local audio or video tracks. If this happens, we store the localTracks in this ref, so that they are correctly published
    // once the user is connected to the room.
    localTracksRef.current = localTracks;
  }, [localTracks]);

  const connect = useCallback(
    async (token, options: { disableVideoProduce?: boolean, disableAudioProduce?: boolean } = {}) => {
      setIsConnecting(true);

      const tokenDetails = parseJwt(token);
      const identity = JSON.parse(tokenDetails.grants.identity);
      if (identity.hostedMedia === "mediasoup") {
        RoomClient.init({
          store: {
            dispatch: () => {},
            getState: () => {},
          },
        });
        // Disconnect before reconnecting
        if (roomRef.current && roomRef.current.disconnectAndWait) {
          await roomRef.current.disconnectAndWait();
        }
        const videoTrack = !options?.disableVideoProduce && localTracksRef.current.find(
          (t) => t.kind === "video"
        );
        const audioTrack = !options?.disableAudioProduce && localTracksRef.current.find(
          (t) => t.kind === "audio"
        );

        await ensureMediaPermissions(confirm, cancelConfirm, setError);
        const roomClient = new RoomClient({
          id: tokenDetails.grants.video.room,
          mediaServerRoot: identity.mediaServerRoot,
          roomId: tokenDetails.grants.video.room,
          peerId: identity.id,
          displayName: identity.name,
          device: deviceInfo(),
          handlerName: undefined,
          // Turn off simulcast for network performance
          useSimulcast: false,
          useSharingSimulcast: false,
          forceTcp: false,
          consume: true,
          forceH264: false,
          forceVP9: false,
          svc: undefined,
          datachannel: true,
          externalVideo: undefined,
          videoTrack,
          audioTrack,
          shouldProduceVideo: !options?.disableVideoProduce,
          shouldProduceAudio: !options?.disableAudioProduce,
        });

        await new Promise((resolve) => roomClient.join(resolve));
        // @ts-ignore
        window.twilioRoom = roomClient;
        setIsConnecting(false);
        setRoom((roomClient as unknown) as SuperRoom);
        return;
      }
      return Video.connect(token, { ...options, tracks: [] }).then(
        (newRoom) => {
          setRoom(newRoom as SuperRoom);
          const disconnect = () => newRoom.disconnect();

          newRoom.once("disconnected", () => {
            // Reset the room only after all other `disconnected` listeners have been called.
            setTimeout(() => setRoom(new EventEmitter() as SuperRoom));
            window.removeEventListener("beforeunload", disconnect);

            if (isMobile) {
              window.removeEventListener("pagehide", disconnect);
            }
          });

          // @ts-ignore
          window.twilioRoom = newRoom;

          localTracksRef.current.forEach((track) =>
            // Tracks can be supplied as arguments to the Video.connect() function and they will automatically be published.
            // However, tracks must be published manually in order to set the priority on them.
            // All video tracks are published with 'low' priority. This works because the video
            // track that is displayed in the 'MainParticipant' component will have it's priority
            // set to 'high' via track.setPriority()
            newRoom.localParticipant.publishTrack(track, {
              priority: track.kind === "video" ? "low" : "standard",
            })
          );

          setIsConnecting(false);

          // Add a listener to disconnect from the room when a user closes their browser
          window.addEventListener("beforeunload", disconnect);

          if (isMobile) {
            // Add a listener to disconnect from the room when a mobile user closes their browser
            window.addEventListener("pagehide", disconnect);
          }
        },
        (error) => {
          onError(error);
          setIsConnecting(false);
        }
      );
    },
    [onError, cancelConfirm, confirm, setError]
  );

  return { room, isConnecting, connect };
}
