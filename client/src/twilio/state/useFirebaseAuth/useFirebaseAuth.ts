import { useCallback, useEffect, useState, useRef } from "react";
import firebase from "firebase/app";
import * as Sentry from "@sentry/browser";
import "firebase/analytics";
import "firebase/auth";
import { IUserDetails, ILoggedInUser } from "../../../engine/types";
import { callFirebaseFunctionWithJson } from "../../../firebase/rest";

const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyBh2Nla_2aLhCrc7moj1MVm0LHMzwGGygQ",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "poker-in-place.firebaseapp.com",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:463904678669:web:0f63eb4518cac966c30644",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "poker-in-place-alpha",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "poker-in-place.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-3KZY3T9KD6",
};

// const firebaseConfig = {
//   apiKey: "AIzaSyAdj3k8r2gxND16zJdX-Q8fhhc5Ynq0lRU",
//   authDomain: "poker-in-place-alpha.firebaseapp.com",
//   databaseURL: "https://poker-in-place-alpha.firebaseio.com",
//   projectId: "poker-in-place-alpha",
//   storageBucket: "poker-in-place-alpha.appspot.com",
//   messagingSenderId: "463904678669",
//   appId: "1:463904678669:web:0f63eb4518cac966c30644",
//   measurementId: "G-YM0YPGH8BL",
// };

let _isAuthenticating = false;

export default function useFirebaseAuth() {
  const [user, setUser] = useState<ILoggedInUser>(null);
  const [userDetails, setUserDetails] = useState<IUserDetails>(
    {} as IUserDetails
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getToken = useCallback(
    async (
      identity: string,
      entityId: string,
      roomId?: string,
      entity?: string,
      passcode?: string
    ) => {
      const headers = new window.Headers();

      const subroute = entity ? `${entity}/` : ``;
      const endpoint = `${process.env.REACT_APP_API_ENDPOINT}/${subroute}token`;
      const args: any = { identity, roomId, passcode };
      if (entity === "tournament") {
        args.tournamentId = entityId;
      } else {
        args.tableId = entityId;
      }

      return callFirebaseFunctionWithJson(
        `${subroute}token`,
        args,
        () => user!.getIdToken(),
        () => null,
        null,
        null,
        0
      ).then((result) => result.token);
    },
    [user]
  );

  useEffect(() => {
    firebase.initializeApp(firebaseConfig);
    if (firebase.analytics) {
      firebase.analytics();
    }
    if (
      window.location.hostname === "localhost" &&
      (!process.env.REACT_APP_API_ENDPOINT ||
        process.env.REACT_APP_API_ENDPOINT.indexOf("localhost") > -1)
    ) {
      firebase.firestore().settings({
        host: process.env.REACT_APP_FIRESTORE_HOST || "localhost:8080",
        ssl: false,
      });
      if (process.env.REACT_APP_API_ENDPOINT !== "http://localhost") {
        firebase.auth().useEmulator("http://localhost:9099/");
      }
    }
    firebase.auth().onAuthStateChanged(async (u) => {
      if (_isAuthenticating) return;
      if (u) {
        const details = await firebase
          .firestore()
          .collection("users")
          .doc(u.uid)
          .get();
        setUserDetails(
          (details && details.data() ? details.data() : {}) as IUserDetails
        );
      } else {
        setUserDetails({} as IUserDetails);
      }
      setUser(u);
      setIsAuthReady(true);
      Sentry.setUser(
        u
          ? {
              id: u.uid,
              username: u.displayName,
              email: u.email,
            }
          : {}
      );
      Sentry.setTag("host", window.location.host);
    });
  }, []);

  const providers: { [key: string]: () => firebase.auth.AuthProvider } = {
    google: () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/plus.login");
      return provider;
    },
    facebook: () => {
      const provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope("email");
      provider.addScope("public_profile");
      provider.setCustomParameters({ auth_type: "reauthenticate" });
      return provider;
    },
    anonymous: () => {
      const provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope("email");
      provider.addScope("public_profile");
      return provider;
    },
  };
  const signIn = useCallback(({ providerName, displayName }) => {
    const provider = providers[providerName]();
    // provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

    if (providerName === "anonymous") {
      return firebase
        .auth()
        .signInAnonymously()
        .then(async (user) => {
          _isAuthenticating = true;
          await user.user.updateProfile({ displayName });
          setUser(user.user);
        });
    }

    return firebase.auth().signInWithRedirect(provider);
    // return firebase
    //   .auth()
    //   .signInWithPopup(provider)
    //   .then((user) => {
    //     setUser(user.user);
    //   });
  }, []);

  const signOut = useCallback(() => {
    return firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
        setUserDetails(null);
      });
  }, []);

  return { user, userDetails, signIn, signOut, isAuthReady, getToken };
}
