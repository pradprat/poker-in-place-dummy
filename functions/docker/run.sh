#!/usr/bin/env bash

# firebase functions:config:get > ./runtime.config.tmp
IFS=
RUNTIME_CONFIG=`cat ./runtime.config.tmp`
FIREBASE_CONFIG="{  \"databaseURL\": \"https://poker-in-place-stage.firebaseio.com\",  \"storageBucket\": \"poker-in-place-stage.appspot.com\",  \"projectId\": \"poker-in-place-stage\", \"authDomain\": \"poker-in-place-stage.firebaseapp.com\" }" 
GOOGLE_APPLICATION_CREDENTIAL_CONTENTS=$(cat ./poker-in-place-stage-firebase-adminsdk.json)
GOOGLE_APPLICATION_CREDENTIAL_CONTENTS="${GOOGLE_APPLICATION_CREDENTIAL_CONTENTS//'\n'/\\\\n}"
export DEBUG=${DEBUG:="mediasoup:INFO* *WARN* *ERROR*"}
export INTERACTIVE=${INTERACTIVE:="true"}
export PROTOO_LISTEN_PORT=${PROTOO_LISTEN_PORT:="443"}
export HTTPS_CERT_FULLCHAIN=${HTTPS_CERT_FULLCHAIN:="/service/certs/live/api.pokerinplace.app/fullchain.pem"}
export HTTPS_CERT_PRIVKEY=${HTTPS_CERT_PRIVKEY:="/service/certs/live/api.pokerinplace.app/privkey.pem"}
export MEDIASOUP_LISTEN_IP=${MEDIASOUP_LISTEN_IP:="0.0.0.0"}
export MEDIASOUP_MIN_PORT=${MEDIASOUP_MIN_PORT:="2000"}
export MEDIASOUP_MAX_PORT=${MEDIASOUP_MAX_PORT:="2020"}
export CLOUD_RUNTIME_CONFIG=${RUNTIME_CONFIG}
export FIREBASE_CONFIG=${FIREBASE_CONFIG}
export GOOGLE_APPLICATION_CREDENTIALS="/service/google.credentials.json"
export GOOGLE_APPLICATION_CREDENTIAL_CONTENTS=${GOOGLE_APPLICATION_CREDENTIAL_CONTENTS}

# Valgrind related options.
export MEDIASOUP_USE_VALGRIND=${MEDIASOUP_USE_VALGRIND:="false"}
export MEDIASOUP_VALGRIND_OPTIONS=${MEDIASOUP_VALGRIND_OPTIONS:="--leak-check=full --track-fds=yes --log-file=/storage/mediasoup_valgrind_%p.log"}

docker run \
	--name=poker-in-place-functions \
	-p ${PROTOO_LISTEN_PORT}:${PROTOO_LISTEN_PORT}/tcp \
	-v ${PWD}:/storage \
	-v ${MEDIASOUP_SRC}:/mediasoup-src \
	--init \
	-e DEBUG \
	-e INTERACTIVE \
	-e DOMAIN \
	-e PROTOO_LISTEN_PORT \
	-e HTTPS_CERT_FULLCHAIN \
	-e HTTPS_CERT_PRIVKEY \
	-e MEDIASOUP_LISTEN_IP \
	-e MEDIASOUP_ANNOUNCED_IP \
	-e MEDIASOUP_MIN_PORT \
	-e MEDIASOUP_MAX_PORT \
	-e MEDIASOUP_USE_VALGRIND \
	-e MEDIASOUP_VALGRIND_OPTIONS \
	-e MEDIASOUP_WORKER_BIN \
	-e CLOUD_RUNTIME_CONFIG \
	-e GOOGLE_APPLICATION_CREDENTIAL_CONTENTS \
	-e GOOGLE_APPLICATION_CREDENTIALS \
	-e FIREBASE_CONFIG \
	-it \
	--rm \
	poker-in-place-functions:latest
