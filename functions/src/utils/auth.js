// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdTokenWithAuth = (auth, db) => async (
  req,
  res,
  next
) => {
  if (req.url.startsWith('/docs')) {
    next();
    return;
  }
  try {
    console.log("Check if request is authorized with Firebase ID token");
    const authorization = req.headers.authorization || req.query.authorization;
    if (
      (!authorization ||
        (!authorization.startsWith("Bearer ") &&
          !authorization.startsWith("Basic "))) &&
      !(req.cookies && req.cookies.__session)
    ) {
      console.error(
        "No Firebase ID token was passed as a Bearer token in the Authorization header.",
        "Make sure you authorize your request by providing the following HTTP header:",
        "Authorization: Bearer <Firebase ID Token>",
        'or by passing a "__session" cookie.'
      );
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    let idToken;
    if (authorization) {
      if (authorization.startsWith("Bearer ")) {
        // Read the ID Token from the Authorization header.
        idToken = authorization.split("Bearer ")[1];
      } else if (authorization.startsWith("Basic ")) {
        idToken = authorization.split("Basic ")[1];
        const params = new Buffer(idToken, "base64")
          .toString("utf8")
          .split(":");
        const docs = await db
          .collection("services")
          .where("username", "==", params[0])
          .where("password", "==", params[1])
          .get();

        if (!docs.size) {
          res.status(403).json({ error: "Unauthorized" });
          return;
        }
        req.service = docs.docs[0].data();
        next();
        return;
      }
    } else if (req.cookies) {
      // Read the ID Token from cookie.
      idToken = req.cookies.__session;
    } else {
      // No cookie
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const decodedIdToken = await auth.verifyIdToken(idToken);
    if (decodedIdToken.provider_id === "anonymous") {
      try {
        const userRecord = await auth.getUser(decodedIdToken.uid);
        decodedIdToken.name = userRecord.displayName;
      } catch (e) {
        // console.error(e);
      }
    }
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    console.error("Error while verifying Firebase ID token:", error);
    res.status(403).send("Unauthorized");
    return;
  }
};

module.exports = { validateFirebaseIdTokenWithAuth };
