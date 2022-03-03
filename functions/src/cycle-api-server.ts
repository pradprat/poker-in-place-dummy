// import * as admin from "firebase-admin";

// admin.initializeApp();

// console.log("cycling api server");

// const inputApiServer = `${process.argv[2]}.api.pokerinplace.app`;
// const apiServers = [
//   `${process.argv[2].substring(
//     0,
//     process.argv[2].length - 1
//   )}0.api.pokerinplace.app`,
//   `${process.argv[2].substring(
//     0,
//     process.argv[2].length - 1
//   )}1.api.pokerinplace.app`,
// ].filter((ms) => ms !== inputApiServer);
// (async function run() {
//   console.log(process.argv);
//   // const ids = [];
//   // for (let i = 0; i < 100; ++i) {
//   let index = Math.floor(Math.random() * apiServers.length);
//   const tables = await admin
//     .firestore()
//     .collection("tables")
//     .where("apiServerHost", "==", inputApiServer)
//     .where("stage", "in", ["initialized", "active", "waiting", "paused"])
//     .get();

//   for (const table of tables.docs) {
//     console.log(
//       table.data().stage,
//       table.data().timestamp,
//       new Date(table.data().timestamp)
//     );
//     if (
//       new Date().getTime() - 1000 * 60 * 60 * 24 * 3 >
//       table.data().timestamp
//     ) {
//       // Expire old tables
//       // await table.ref.update({ stage: "ended" });
//       console.log("Expiring: " + table.id);
//     } else {
//       // Let's round robin...
//       const updatedApiServer = apiServers[index++ % apiServers.length];
//       console.log("Updated: " + table.id, updatedApiServer);
//       // await table.ref.update({ mediasoupHost: updatedMediaServer, origMediasoupHost: process.argv[2] });
//     }
//   }
//   const tournaments = await admin
//     .firestore()
//     .collection("tournaments")
//     .where("apiServerHost", "==", inputApiServer)
//     .where("status", "in", [
//       "initialized",
//       "active",
//       "assigning-tables",
//       "pause-requested",
//       "paused",
//     ])
//     .get();

//   for (const table of tables.docs) {
//     console.log(
//       table.data().stage,
//       table.data().timestamp,
//       new Date(table.data().timestamp)
//     );
//     if (
//       new Date().getTime() - 1000 * 60 * 60 * 24 * 3 >
//       table.data().timestamp
//     ) {
//       // Expire old tables
//       // await table.ref.update({ stage: "ended" });
//       console.log("Expiring: " + table.id);
//     } else {
//       // Let's round robin...
//       const updatedApiServer = apiServers[index++ % apiServers.length];
//       console.log("Updated: " + table.id, updatedApiServer);
//       // await table.ref.update({ mediasoupHost: updatedMediaServer, origMediasoupHost: process.argv[2] });
//     }
//   }
//   console.log(tables.size);
//   //   ids.push(id.id);
//   // }
//   // console.log(JSON.stringify(ids));
// })()
//   .then(() => process.exit(0))
//   .catch(() => process.exit(1));
