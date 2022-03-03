import { EventEmitter } from "events";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Room, TwilioError } from "twilio-video";
import { VideoProvider } from "./index";
import useLocalTracks from "./useLocalTracks/useLocalTracks";
import useRoom from "./useRoom/useRoom";
import useHandleRoomDisconnectionErrors from "./useHandleRoomDisconnectionErrors/useHandleRoomDisconnectionErrors";
import useHandleTrackPublicationFailed from "./useHandleTrackPublicationFailed/useHandleTrackPublicationFailed";
import useVideoContext from "../../hooks/useVideoContext/useVideoContext";

const mockRoom = new EventEmitter() as Room;
const mockOnDisconnect = jest.fn();
jest.mock("./useRoom/useRoom", () =>
  jest.fn(() => ({ room: mockRoom, isConnecting: false, connect: () => { } }))
);
jest.mock("./useLocalTracks/useLocalTracks", () =>
  jest.fn(() => ({
    localTracks: [{ name: "mockTrack" }],
    getLocalVideoTrack: () => { },
    getLocalAudioTrack: () => { },
    getAudioAndVideoTracks: () => { },
    isAcquiringLocalTracks: true,
    removeLocalVideoTrack: () => { },
  }))
);
jest.mock(
  "./useHandleRoomDisconnectionErrors/useHandleRoomDisconnectionErrors"
);
jest.mock("./useHandleTrackPublicationFailed/useHandleTrackPublicationFailed");
jest.mock("./useHandleTrackPublicationFailed/useHandleTrackPublicationFailed");

describe("the VideoProvider component", () => {
  it("should correctly return the Video Context object", () => {
    const wrapper: React.FC = ({ children }) => (
      <VideoProvider
        onError={() => { }}
        options={{ dominantSpeaker: true }}
      >
        {children}
      </VideoProvider>
    );
    const { result } = renderHook(useVideoContext, { wrapper });
    expect(result.current).toMatchObject({
      isConnecting: false,
      localTracks: [{ name: "mockTrack" }],
      room: mockRoom,
      onError: expect.any(Function),
      connect: expect.any(Function),
      onDisconnect: mockOnDisconnect,
      getLocalVideoTrack: expect.any(Function),
      getLocalAudioTrack: expect.any(Function),
      removeLocalVideoTrack: expect.any(Function),
      isAcquiringLocalTracks: true,
      // toggleScreenShare: expect.any(Function),
    });
    expect(useRoom).toHaveBeenCalledWith(
      [{ name: "mockTrack" }],
      expect.any(Function),
      {
        dominantSpeaker: true,
      }
    );
    expect(useLocalTracks).toHaveBeenCalled();
    expect(useHandleRoomDisconnectionErrors).toHaveBeenCalledWith(
      mockRoom,
      expect.any(Function)
    );
    expect(useHandleTrackPublicationFailed).toHaveBeenCalledWith(
      mockRoom,
      expect.any(Function)
    );
  });
});
