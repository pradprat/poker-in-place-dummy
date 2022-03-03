import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Tracker from "@asayerio/tracker";
import * as Sentry from "@sentry/react";

import { useAppState } from "../../twilio/state";

export interface SessionRecordingContextType {
  start: { (): void };
  stop: { (): void };
  metadata: { (key: string, value: string): void };
  event: { (key: string, payload: any, level?: string): void };
  tracker: Tracker;
}

export const SessionRecordingContext = createContext<SessionRecordingContextType>(null!);
const ASAYER_PROJECT_ID: string = process.env.REACT_APP_ASAYER;

export default function SessionRecordingProvider(props: React.PropsWithChildren<{}>) {
  const [tracker, setTracker] = useState<Tracker>();
  const { user } = useAppState();
  const userId = user?.uid;
  const userName = user?.displayName;

  useEffect(() => {
    if (userId && !tracker && ASAYER_PROJECT_ID) {
      const _tracker = new Tracker({
        projectID: parseInt(ASAYER_PROJECT_ID, 10),
        __allow_not_secure: true,
      });
      _tracker.userID(userId);
      _tracker.metadata("uid", userId);
      _tracker.metadata("userName", userName);
      setTracker(_tracker);
    }
  }, [userId, userName, tracker]);

  const start = useCallback(() => {
    if (tracker && !tracker?.active()) {
      tracker.start();
      Sentry.setTags({ asayer_session_id: tracker.sessionID() })
    }
  }, [tracker]);
  const metadata = useCallback((key: string, value: string) => {
    tracker?.metadata(key, value);
  }, [tracker]);
  const event = useCallback((key: string, payload: any, level?: string) => {
    tracker?.event(key, payload, level);
  }, [tracker]);
  const stop = useCallback(() => {
    tracker?.stop();
  }, [tracker]);

  const contextValue = {
    start,
    stop,
    metadata,
    event,
    tracker,
  } as SessionRecordingContextType;

  return (
    <SessionRecordingContext.Provider value={{ ...contextValue }}>
      {props.children}
    </SessionRecordingContext.Provider>
  );
}

export function useSessionRecording() {
  let context = useContext(SessionRecordingContext);
  if (!context) {
    console.warn("useSessionRecordingProvider must be used within the SessionRecordingProvider");
    context = {
      start: () => { },
      stop: () => { },
      metadata: (key: string, value: string) => { },
      event: (key: string, payload: any, level?: string) => { },
      tracker: null,
    }
  }
  return context;
}
