import { useEffect, useState, useCallback } from "react";
import useVideoContext from "../useVideoContext/useVideoContext";
import { RemoteParticipant, Participant } from "twilio-video";
import { EventEmitter } from "events";

export default function useStructuredMessages() {
  const { room } = useVideoContext();
  const [eventEmitter] = useState(new EventEmitter());
  const handleStructuredMessage = (msg: any) => {
    eventEmitter.emit('structuredMessage', msg);
  };

  const addStructuredMessageHandler = useCallback(
    (fn: { (msg: any): boolean }) => {
      eventEmitter.on('structuredMessage', fn);
    },
    [room, eventEmitter]
  );

  const removeStructuredMessageHandler = useCallback(
    (fn: { (msg: any): boolean }) => {
      eventEmitter.off("structuredMessage", fn);
    },
    [room, eventEmitter]
  );

  useEffect(() => {
    room.on("structuredMessage", handleStructuredMessage);
    return () => {
      room.off("structuredMessage", handleStructuredMessage);
      eventEmitter.removeAllListeners();
    };
  }, [room, eventEmitter]);

  return {
    addStructuredMessageHandler,
    removeStructuredMessageHandler,
  };
}
