const admin = require("firebase-admin");
const functions = require("firebase-functions");

const { generateDeck } = require("./utils/deck");
const db = admin.firestore();

exports.createGame = functions.firestore
  .document("tables/{tableId}")
  .onCreate(async (snap, context) => {
    // Get an object representing the document
    // e.g. {'name': 'Marie', 'age': 66}
    const newValue = snap.data();

    // access a particular field as you would any JS property
    const { name } = newValue;

    const deck = generateDeck();

    const deckRef = await db.collection("decks").add({ cards: deck });

    // perform desired operations ...
    return snap.ref.set(
      {
        activeDeckId: deckRef.id,
      },
      { merge: true }
    );
  });
