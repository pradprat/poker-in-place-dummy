import React from "react";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase";

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: "popup",
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: "/signedIn",
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      scopes: ["https://www.googleapis.com/auth/contacts.readonly"],
      customParameters: {
        // Forces account selection even when one account
        // is available.
        prompt: "select_account",
      },
    },
    // firebase.auth.FacebookAuthProvider.PROVIDER_ID
  ],
};

export default function SignInScreen(props) {
  return (
    <div>
      <h1>My App</h1>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth
        uiConfig={{
          ...uiConfig,
          callbacks: {
            signInSuccess: (user, context) => {
              const { providerData } = user;
              props.onSignInSuccess(providerData, user, context);
            },
          },
        }}
        firebaseAuth={firebase.auth()}
      />
    </div>
  );
}
