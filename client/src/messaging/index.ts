import firebase from "firebase/app";

export const askForPermissioToReceiveNotifications = async () => {
  try {
    const messaging = firebase.messaging();
    await messaging.requestPermission();
    try {
      const token = await messaging.getToken();

      return token;
    } catch (e) {}
  } catch (error) {
    console.error(error);
  }
};
