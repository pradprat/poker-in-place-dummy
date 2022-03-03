global.window = {};
global.document = { getElementById: () => {}, createElement: () => {}};
const { ZoomMtg } = require("@zoomus/websdk");

const crypto = require('crypto') // crypto comes with Node.js

function generateSignature(apiKey, apiSecret, meetingNumber, role) {

  // Prevent time sync issue between client signature generation and zoom 
  const timestamp = new Date().getTime() - 30000
  const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
  const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
  const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')

  return signature
};

console.log(
  generateSignature(
    "Gg8zyPx1l4gnRx4nToVYYiGWbtl1u8gB0m8V",
    "h5IsASKFDDHFOBtnJGGhk3cD7FE4wpXRxowe",
    "97136281851",
    0
  )
);

  // https://zoom.us/j/99537935713?pwd=UzZyemhFR2M3U3p6YTh1RWc1LzZDUT09
  const meetingConfig = {
    mn: "97136281851",
    name: "99537935713",
    pwd: "VK3eR7",
    role: 0,
    email: b64EncodeUnicode("nbclark@gmail.com"),
    lang: "en-US",
  };

  const signature = ZoomMtg.generateSignature({
    meetingNumber: meetingConfig.mn,
    apiKey: "Gg8zyPx1l4gnRx4nToVYYiGWbtl1u8gB0m8V",
    apiSecret: "h5IsASKFDDHFOBtnJGGhk3cD7FE4wpXRxowe",
    role: meetingConfig.role,
    success (res) {
      console.log(res.result);
      meetingConfig.signature = res.result;
      meetingConfig.apiKey = "Gg8zyPx1l4gnRx4nToVYYiGWbtl1u8gB0m8V";
    },
  });

  console.log({signature});