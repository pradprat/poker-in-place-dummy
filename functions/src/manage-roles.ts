import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const validRoles = ["admin"];

(async function run() {
  console.log(process.argv);
  const email = process.argv[2];
  const role = process.argv[3];
  console.log({ email, role });

  if (validRoles.indexOf(role) < 0) {
    console.error("Role not found");
    process.exit(-2);
  }

  console.log("x");

  // console.log(
  //   1,
  //   await admin.auth().getUsers([{ uid: "83KoNTMkgBYhZOYjUqORx52LYYk1" }])
  // );

  const user = await admin.auth().getUserByEmail(email);

  if (!user) {
    console.error("User not found");
    process.exit(-1);
  }
  console.log({ user });
  await admin.auth().setCustomUserClaims(user.uid, { role });
  // const ids = [];
  // for (let i = 0; i < 100; ++i) {
  //   const id = await admin
  //     .firestore()
  //     .collection("codes")
  //     .add({ for: "2021-02-08-poker501-guests" });
  //   ids.push(id.id);
  // }
  // console.log(JSON.stringify(ids));
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
