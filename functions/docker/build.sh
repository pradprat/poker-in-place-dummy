#!/bin/bash

# Usage:
#
# - DEV_NO_CACHE environment variable is optional. If set to "true" the docker image
#   will be rebuilt from scratch (without reusing cache). Useful to force the execution
#   of `npm install` within Dockerfile.
#
# Example:
#
#   DEV_NO_CACHE="true" ./build-local.sh

set -e


GIT_TAG=$(git log -1 --pretty=%H)
EXTRA_ARGS="";

if [ "${DEV_NO_CACHE}" = "true" ] ; then
	EXTRA_ARGS="${EXTRA_ARGS} --no-cache"
fi

echo ">>> Running docker build ${EXTRA_ARGS}"
docker build -f Dockerfile-legacy \
	${EXTRA_ARGS} \
	--tag poker-in-place-functions:latest \
	--tag poker-in-place-functions:$GIT_TAG \
	--tag us.gcr.io/poker-in-place/poker-in-place-functions \
	.

echo ">>> Image built"
