GIT_TAG=$(git log -1 --pretty=%H)
node save-git-hash.js
# DEV_NO_CACHE=true sh docker/build.sh
sh docker/build.sh
docker tag us.gcr.io/poker-in-place/poker-in-place-functions:latest us.gcr.io/poker-in-place/poker-in-place-functions:$GIT_TAG
docker push us.gcr.io/poker-in-place/poker-in-place-functions:$GIT_TAG