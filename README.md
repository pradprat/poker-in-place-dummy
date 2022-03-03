# Poker in Place

An online video experience playing poker (for now) with your friends, colleagues, family, and peraps someday, new acquantances.

## Stack

0. Javascript - the poker engine, game flow, etc. was written in JS and used by React and Firebase.
1. React - React is used to render the entire UI: homepage, sign-up, waiting room, game play, results
2. Firebase - Firebase handles the synchronization between players at the same table, and manages permissions so we can keep cards secure. We also leverage firebase functions to run the poker engine in the cloud to ensure that the game state cannot be manipulated by the client.
3. Mediasoup - SFU video/audio forwarder
4. (no more) Twilio - Twilio does the heavy lifting of the video/audio comms. Works quite well but is quite expensive.

# Setup

### 2. Install [nvm](https://github.com/nvm-sh/nvm)

```bash
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh) | bash
```

### 3. Install node & yarn via nvm

```bash
cd poker-in-place
nvm install 12.21.0
nvm use
npm i -g yarn
```

### 4. Install & Login to Firebase tooling.

Login to Firebase (ask Mikki or Michael to add you to the project)

```bash
npm install -g firebase-tools
firebase login
firebase use develop
```

### 5. RuntimeConfiguration

Ask for **runtimeconfig.json** and copy to `functions/**.runtimeconfig.json`

### 6. JDK Installation

Download and Install latest version of JDK from https://www.oracle.com/java/technologies/downloads/ for operating system of your machine.
Ignore the errors in termainal #1 and terminal #4 if you want to run only the server locally.

### 7. Run project locally

1. Open 4 terminals

2. Each console should be running on the correct node version: **nvm use**

3. _terminal #1:_ **functions** **folder**: `yarn install && npx ts-watch`

4. _terminal #2_ **root folder**: `firebase emulators:start`

5. _terminal #3:_ **functions folder**: `sh local-dev.sh`

6. _terminal #4:_ **client folder**: `yarn && yarn start-develop-proto`

# Updating Certificates

## Media servers

1. sh generate-cert.sh
2. (Follow the DNS prompts)
3. update mediasoup.fullchain.pem & mediasoup.private.pem to acording new certificates
4. sh build-deploy-docker.sh
5. cd functions && sh update-media-certs.sh
