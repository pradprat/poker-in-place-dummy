importScripts("https://www.gstatic.com/firebasejs/7.13.2/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/7.13.2/firebase-messaging.js"
);

firebase.initializeApp({
  messagingSenderId: "683106565551",
  projectId: "poker-in-place",
  apiKey: "AIzaSyBh2Nla_2aLhCrc7moj1MVm0LHMzwGGygQ",
  authDomain: "poker-in-place.firebaseapp.com",
  appId: "poker-in-place",
  projectId: "poker-in-place",
});

const messaging = firebase.messaging();
messaging.setBackgroundMessageHandler((payload) => {
  const dataFromServer = JSON.parse(payload.data.notification);
  const notificationTitle = dataFromServer.title;
  const notificationOptions = {
    body: dataFromServer.body,
    icon: dataFromServer.icon,
    data: {
      url: dataFromServer.url,
    },
  };
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  const urlToRedirect = event.notification.data.url;
  event.notification.close();
  event.waitUntil(self.clients.openWindow(urlToRedirect));
});
