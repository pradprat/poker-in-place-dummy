import React, { createContext, useContext, useState } from "react";
import { TwilioError } from "twilio-video";
import useFirebaseAuth from "./useFirebaseAuth/useFirebaseAuth";
import usePasscodeAuth from "./usePasscodeAuth/usePasscodeAuth";
import { IUserDetails, ILoggedInUser } from "../../engine/types";
import { SELECTED_AUDIO_OUTPUT_KEY } from "../../constants";

export interface StateContextType {
  error: TwilioError | null;
  setError(error: TwilioError | null): void;
  getToken(
    name: string,
    entityId: string,
    roomId?: string,
    entity?: string,
    passcode?: string
  ): Promise<string>;
  user?: ILoggedInUser;
  userDetails: IUserDetails;
  signIn?(args: any): Promise<void>;
  signIn?(passcode?: string): Promise<void>;
  signOut?(): Promise<void>;
  isAuthReady?: boolean;
  isFetching: boolean;
  activeSinkId: string;
  setActiveSinkId(sinkId: string): void;
}

export const StateContext = createContext<StateContextType>(null!);

/*
  The 'react-hooks/rules-of-hooks' linting rules prevent React Hooks fron being called
  inside of if() statements. This is because hooks must always be called in the same order
  every time a component is rendered. The 'react-hooks/rules-of-hooks' rule is disabled below
  because the "if (process.env.REACT_APP_SET_AUTH === 'firebase')" statements are evaluated
  at build time (not runtime). If the statement evaluates to false, then the code is not
  included in the bundle that is produced (due to tree-shaking). Thus, in this instance, it
  is ok to call hooks inside if() statements.
*/
export default function AppStateProvider(props: React.PropsWithChildren<{}>) {
  const [error, setError] = useState<TwilioError | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  let selectedAudioOutputId: string = null;
  try {
    selectedAudioOutputId = window.localStorage.getItem(
      SELECTED_AUDIO_OUTPUT_KEY
    );
  } catch (e) {
  }
  const [activeSinkId, setActiveSinkId] = useState(
    selectedAudioOutputId || "default"
  );

  let contextValue = {
    error,
    setError,
    isFetching,
    activeSinkId,
    setActiveSinkId,
  } as StateContextType;

  if (process.env.REACT_APP_SET_AUTH === "firebase") {
    contextValue = {
      ...contextValue,
      ...useFirebaseAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  }
  //  else if (process.env.REACT_APP_SET_AUTH === "passcode") {
  //   contextValue = {
  //     ...contextValue,
  //     ...usePasscodeAuth(), // eslint-disable-line react-hooks/rules-of-hooks
  //   };
  // }
  // else {
  //   contextValue = {
  //     ...contextValue,
  //     getToken: async (identity, roomName) => {
  //       const headers = new window.Headers();
  //       const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || "/token";
  //       const params = new window.URLSearchParams({ identity, roomName });

  //       return fetch(`${endpoint}?${params}`, { headers }).then((res) =>
  //         res.text()
  //       );
  //     },
  //   };
  // }

  const getToken: StateContextType["getToken"] = (
    name,
    entityId,
    roomId = "",
    entity = ""
  ) => {
    setIsFetching(true);
    return contextValue
      .getToken(name, entityId, roomId, entity)
      .then((res) => {
        setIsFetching(false);
        return res;
      })
      .catch((err) => {
        setError(err);
        setIsFetching(false);
        return Promise.reject(err);
      });
  };

  return (
    <StateContext.Provider value={{ ...contextValue, getToken }}>
      {props.children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useAppState must be used within the AppStateProvider");
  }
  return context;
}
