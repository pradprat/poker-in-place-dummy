import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

console.log("cycling media server");

const mediaServers = [
  "n0.media.pokerinplace.app",
  "n1.media.pokerinplace.app",
  "n2.media.pokerinplace.app",
  "n3.media.pokerinplace.app",
  "n4.media.pokerinplace.app",
  "n5.media.pokerinplace.app",
  "n6.media.pokerinplace.app",
].filter((ms) => ms !== process.argv[2]);
(async function run() {
  console.log(process.argv);
  // const ids = [];
  // for (let i = 0; i < 100; ++i) {
  let index = Math.floor(Math.random() * mediaServers.length);
  if (process.argv[3] === "up") {
    console.log(`Bringing ${process.argv[2]} back up`);
    const tables = await admin
      .firestore()
      .collection("tables")
      .where("origMediasoupHost", "==", process.argv[2])
      .get();

    for (const table of tables.docs) {
      console.log(
        table.data().stage,
        table.data().timestamp,
        new Date(table.data().timestamp)
      );
      await table.ref.update({
        mediasoupHost: process.argv[2],
        origMediasoupHost: admin.firestore.FieldValue.delete(),
      });
    }
  } else {
    const tables = await admin
      .firestore()
      .collection("tables")
      .where("mediasoupHost", "==", process.argv[2])
      .where("stage", "in", ["initialized", "active", "waiting", "paused"])
      .get();

    for (const table of tables.docs) {
      console.log(
        table.data().stage,
        table.data().timestamp,
        new Date(table.data().timestamp)
      );
      if (
        new Date().getTime() - 1000 * 60 * 60 * 24 * 3 >
        table.data().timestamp
      ) {
        // Expire old tables
        await table.ref.update({ stage: "ended" });
        console.log("Expiring: " + table.id);
      } else {
        // Let's round robin...
        const updatedMediaServer = mediaServers[index++ % mediaServers.length];
        console.log("Updated: " + table.id, updatedMediaServer);
        await table.ref.update({
          mediasoupHost: updatedMediaServer,
          origMediasoupHost: process.argv[2],
        });
      }
    }
    console.log(tables.size);
  }
  //   ids.push(id.id);
  // }
  // console.log(JSON.stringify(ids));
})()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
