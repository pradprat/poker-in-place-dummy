const ics = require("ics");
const google = require("googleapis").google;
const calendar = google.calendar("v3");
const moment = require("moment-timezone");

async function createCalendarICS(
  id,
  name,
  startDate,
  timeZone,
  duration,
  organizerName,
  organizerEmail,
  inviteEmails,
  productTitle,
) {
  const startMoment = moment.tz(startDate, timeZone).utc();
  return await ics.createEvent({
    title: `${productTitle}: ${name}`,
    description: `You've been invited by ${organizerName} to join a video poker game!`,
    busyStatus: "FREE",
    start: [
      startMoment.year(),
      startMoment.month() + 1,
      startMoment.date(),
      startMoment.hour(),
      startMoment.minute(),
    ],
    startInputType: 'utc',
    duration: { minutes: duration },
    url: `https://poker501.com/table/${id}?join`,
    organizer: { name: organizerName, email: organizerEmail },
    attendees: inviteEmails.map((email) => ({ email })),
    uid: id,
  });
}

async function createCalendarInvite(
  keyFilename,
  id,
  name,
  startDate,
  timeZone,
  duration,
  organizerName,
  organizerEmail,
  inviteEmails
) {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  // const keyFilename = "./poker-in-place-76649783f8a3.json"; // Your should make it an environment variable

  const client = await google.auth.getClient({
    keyFilename,
    scopes,
  });

  // Delegated Credential
  client.subject = "nick@pokerinplace.app";

  // console.log(
  //   moment(startDate).add(duration, "minutes").format("YYYY-MM-DDThh:mm:ss"),
  //   startDate,
  //   client
  // );

  const res = await calendar.events.insert({
    calendarId: client.subject,
    resource: {
      guestsCanModify: true,
      sendNotifications: true,
      sendUpdates: "all",
      summary: `Poker501: ${name}`,
      start: { dateTime: startDate, timeZone },
      end: {
        dateTime: moment(startDate)
          .add(duration, "minutes")
          .format("YYYY-MM-DDTHH:mm:ss"),
        timeZone,
      },
      attendees: [
        { email: organizerEmail, displayName: organizerName },
        ...inviteEmails.map((email) => ({ email })),
      ],
      location: `https://pokerinplace.app/table/${id}?join`,
    },
    auth: client,
  });
}

module.exports = { createCalendarICS, createCalendarInvite };

// (function run() {
//   createCalendarInvite(
//     "./poker-in-place-76649783f8a3.json",
//     "123",
//     "test",
//     "2020-04-20T12:30:00Z",
//     "America/Los_Angeles",
//     90,
//     "Nicholas Clark",
//     "nbclark@gmail.com",
//     []
//   );
// })();
