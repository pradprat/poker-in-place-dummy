GIT_TAG=$(git log -1 --pretty=%H)
DEV_NO_CACHE=true sh docker/build.sh
docker tag us.gcr.io/poker-in-place/poker-in-place-mediasoup:latest us.gcr.io/poker-in-place/poker-in-place-mediasoup:$GIT_TAG
docker push us.gcr.io/poker-in-place/poker-in-place-mediasoup:$GIT_TAG