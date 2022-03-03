const functions = require("firebase-functions");
const mailjet = require("node-mailjet");

const { createCalendarICS } = require("./calendar-utils");
const logger = require('../utils/log').default;
const { loadConfig } = require('./config');


const { getMaximumDuration } = require("../engine/index");

async function sendInvite(
  emails,
  fromUser,
  id,
  name,
  startDate,
  timeZone,
  mode,
  rootUrl,
  joinUrl
) {
  const config = await loadConfig();
  const mailJetApiKey = config.mailjet.api_key;
  const mailJetApiSecret = config.mailjet.api_secret;
  const mailer = mailjet.connect(mailJetApiKey, mailJetApiSecret);

  const fromEmail =
    rootUrl && rootUrl.indexOf("wowpokerlive")
      ? "aces@wowpokerlive.com"
      : "nick@pokerinplace.app";
  try {
    const productTitle =
      rootUrl.indexOf("poker501.com") >= 0 ? "Poker501" : "Poker in Place";
    const icsData = await createCalendarICS(
      id,
      name,
      startDate,
      timeZone,
      getMaximumDuration(mode) / 60,
      fromUser.name,
      fromUser.email,
      [...emails, fromEmail],
      productTitle,
    );
    const mailRequest = {
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: productTitle,
          },
          To: emails.map((email) => ({
            Email: email,
            Name: email,
          })),
          Bcc: [
            {
              Email: "nick@pokerinplace.app",
              Name: `${productTitle} Admin`,
            },
          ],
          Subject: `${productTitle}: Join ${fromUser.name}'s Game`,
          TextPart: `${fromUser.name} invites you to experience a new way to play (quarantined) poker.
          
          Follow the link below to enjoy an immersive video + poker experience.
          
          Click here to join the game: ${joinUrl || `${rootUrl}/table/${id}?join`}`,
          CustomID: "PIPIntroEmail",
          Attachments: [
            {
              ContentType: "text/calendar",
              Filename: "invite.ics",
              Base64Content: Buffer.from(icsData.value).toString("base64"),
            },
          ],
        },
      ],
    };
    await mailer.post("send", { version: "v3.1" }).request(mailRequest);
  } catch (e) {
    logger.exception(e);
  }
}

module.exports = { sendInvite };
