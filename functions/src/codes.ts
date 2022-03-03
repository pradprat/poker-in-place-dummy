import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

console.log("done");

(async function run() {
  const ids = [];
  for (let i = 0; i < 100; ++i) {
    const id = await admin
      .firestore()
      .collection("codes")
      .add({ for: "2021-02-08-poker501-guests" });
    ids.push(id.id);
  }
  console.log(JSON.stringify(ids));
})()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
