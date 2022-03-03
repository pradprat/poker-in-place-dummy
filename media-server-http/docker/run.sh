#!/usr/bin/env bash

export DEBUG=${DEBUG:="mediasoup:INFO* *WARN* *ERROR*"}
export INTERACTIVE=${INTERACTIVE:="true"}
export PROTOO_LISTEN_PORT=${PROTOO_LISTEN_PORT:="443"}
export MEDIASOUP_LISTEN_IP=${MEDIASOUP_LISTEN_IP:="0.0.0.0"}
export MEDIASOUP_MIN_PORT=${MEDIASOUP_MIN_PORT:="2000"}
export MEDIASOUP_MAX_PORT=${MEDIASOUP_MAX_PORT:="2020"}

# Valgrind related options.
export MEDIASOUP_USE_VALGRIND=${MEDIASOUP_USE_VALGRIND:="false"}
export MEDIASOUP_VALGRIND_OPTIONS=${MEDIASOUP_VALGRIND_OPTIONS:="--leak-check=full --track-fds=yes --log-file=/storage/mediasoup_valgrind_%p.log"}

docker run \
	--name=poker-in-place-mediasoup \
	-p ${PROTOO_LISTEN_PORT}:${PROTOO_LISTEN_PORT}/tcp \
	-p ${MEDIASOUP_MIN_PORT}-${MEDIASOUP_MAX_PORT}:${MEDIASOUP_MIN_PORT}-${MEDIASOUP_MAX_PORT}/udp \
	-p ${MEDIASOUP_MIN_PORT}-${MEDIASOUP_MAX_PORT}:${MEDIASOUP_MIN_PORT}-${MEDIASOUP_MAX_PORT}/tcp \
	-v ${PWD}:/storage \
	-v ${MEDIASOUP_SRC}:/mediasoup-src \
	--init \
	-e DEBUG \
	-e INTERACTIVE \
	-e DOMAIN \
	-e PROTOO_LISTEN_PORT \
	-e MEDIASOUP_LISTEN_IP \
	-e MEDIASOUP_ANNOUNCED_IP \
	-e MEDIASOUP_MIN_PORT \
	-e MEDIASOUP_MAX_PORT \
	-e MEDIASOUP_USE_VALGRIND \
	-e MEDIASOUP_VALGRIND_OPTIONS \
	-e MEDIASOUP_WORKER_BIN \
	-it \
	--rm \
	poker-in-place-mediasoup:latest
