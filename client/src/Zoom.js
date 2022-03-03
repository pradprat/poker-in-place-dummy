/* eslint-disable no-bitwise */
function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (
      match,
      p1
    ) => String.fromCharCode(`0x${p1}`))
  );
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
}

export default function ({ number, password, email, userName }) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ZoomMtg } = require("@zoomus/websdk");

  ZoomMtg.setZoomJSLib("https://source.zoom.us/1.9.0/lib", "/av");
  ZoomMtg.preLoadWasm();
  ZoomMtg.prepareJssdk();
  //   document.getElementById("zmmtg-root").style.display = "none";

  // https://zoom.us/j/99537935713?pwd=UzZyemhFR2M3U3p6YTh1RWc1LzZDUT09
  const meetingConfig = {
    mn: number,
    name: number,
    pwd: password,
    role: 0,
    email: b64EncodeUnicode(email),
    lang: "en-US",
  };

  const signature = ZoomMtg.generateSignature({
    meetingNumber: meetingConfig.mn,
    apiKey: "pNQ1kzDxQnKSs1BE_Xw7wA",
    apiSecret: "laSUROG12Q1REXEm5AmzAFBj2jBESVAlajwS",
    role: meetingConfig.role,
    success(res) {
      console.log(res.result);
      meetingConfig.signature = res.result;
      meetingConfig.apiKey = "pNQ1kzDxQnKSs1BE_Xw7wA";
    },
  });

  setTimeout(() => {
    document.getElementById("zmmtg-root").style.display = "block";
    ZoomMtg.init({
      leaveUrl: "/msg?zoom=ended",
      success() {
        ZoomMtg.join({
          meetingNumber: meetingConfig.mn,
          userName,
          signature,
          apiKey: "pNQ1kzDxQnKSs1BE_Xw7wA",
          userEmail: email || `${hashCode(userName)}@pokerinplace.app`,
          passWord: meetingConfig.pwd,
          success(res) {
            console.log("join meeting success");
            console.log("get attendeelist");
            ZoomMtg.getAttendeeslist({});
            ZoomMtg.getCurrentUser({
              success(res) {
                console.log("success getCurrentUser", res.result.currentUser);
              },
            });
          },
          error(res) {
            console.log(res);
          },
        });
      },
      error(res) {
        console.log(res);
      },
    });
  }, 1000);

  ZoomMtg.inMeetingServiceListener("onUserJoin", (data) => {
    console.log("inMeetingServiceListener onUserJoin", data);
  });

  ZoomMtg.inMeetingServiceListener("onUserLeave", (data) => {
    console.log("inMeetingServiceListener onUserLeave", data);
  });

  ZoomMtg.inMeetingServiceListener("onUserIsInWaitingRoom", (data) => {
    console.log("inMeetingServiceListener onUserIsInWaitingRoom", data);
  });

  let audioButtonSearchInterval;

  ZoomMtg.inMeetingServiceListener("onMeetingStatus", (data) => {
    console.log("inMeetingServiceListener onMeetingStatus", data);
    if (data.meetingStatus === 2 && !audioButtonSearchInterval) {
      audioButtonSearchInterval = setInterval(() => {
        const buttons = document.getElementsByClassName(
          "join-audio-by-voip__join-btn"
        );
        if (buttons.length) {
          clearInterval(audioButtonSearchInterval);
          buttons[0].click();
          setTimeout(() => {
            ZoomMtg.getCurrentUser({
              success(res) {
                ZoomMtg.mute({
                  userId: res.result.currentUser.userId,
                  mute: true,
                });
              },
            });
          }, 100);
        }
      }, 100);
    }
  });
}
